import json
import random
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth import login, logout, get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from django.core.cache import cache

from .models import Identity, Post, Solve

# Cache key and TTL for feed (production). Invalidate on new post/solve.
FEED_CACHE_KEY = 'feed_posts'
FEED_CACHE_TIMEOUT = 120  # seconds

User = get_user_model()


def _node_id(user):
    identity = getattr(user, 'identity', None)
    return identity.node_id if identity else getattr(user, 'username', 'Node #----')


def _time_ago(dt):
    if not dt:
        return '—'
    d = timezone.now() - dt
    secs = d.total_seconds()
    if secs < 60:
        return 'Just now'
    if secs < 3600:
        return f'{int(secs // 60)}m ago'
    if secs < 86400:
        return f'{int(secs // 3600)}h ago'
    if secs < 604800:
        return f'{int(secs // 86400)}d ago'
    return dt.strftime('%b %d')


def index(request):
    return render(request, 'index.html')


@require_http_methods(["GET", "POST"])
@ensure_csrf_cookie
def signin(request):
    if request.method == "GET":
        return render(request, 'signin.html')
    try:
        body = json.loads(request.body)
        passphrase = (body.get("passphrase") or "").strip()
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"success": False, "error": "Invalid JSON"}, status=400)
    if not passphrase:
        return JsonResponse({"success": False, "error": "Passphrase required"}, status=400)
    user = __authenticate_by_passphrase(request, passphrase)
    if user is None:
        return JsonResponse({"success": False, "error": "Passphrase not recognised"}, status=401)
    login(request, user, backend='core.backends.PassphraseAuthBackend')
    return JsonResponse({"success": True, "node_id": _node_id(user)})


@require_http_methods(["GET", "POST"])
@ensure_csrf_cookie
def signup(request):
    if request.method == "GET":
        return render(request, 'signup.html')
    try:
        body = json.loads(request.body)
        passphrase = (body.get("passphrase") or "").strip()
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"success": False, "error": "Invalid JSON"}, status=400)
    if not passphrase:
        return JsonResponse({"success": False, "error": "Passphrase required"}, status=400)
    for identity in Identity.objects.all():
        if check_password(passphrase, identity.passphrase_hash):
            return JsonResponse({"success": False, "error": "This passphrase is already in use. Sign in instead."}, status=409)
    node_id = _generate_unique_node_id()
    user = User(username=node_id)
    user.set_unusable_password()
    user.save()
    Identity.objects.create(
        user=user,
        node_id=node_id,
        passphrase_hash=make_password(passphrase),
    )
    return JsonResponse({"success": True, "node_id": node_id})


def _generate_unique_node_id():
    for _ in range(20):
        nid = "Node #" + str(1000 + random.randint(0, 8999))
        if not Identity.objects.filter(node_id=nid).exists():
            return nid
    return "Node #" + str(10000 + random.randint(0, 89999))


def __authenticate_by_passphrase(request, passphrase):
    from .backends import PassphraseAuthBackend
    return PassphraseAuthBackend().authenticate(request, passphrase=passphrase)


def _build_feed_posts_list(posts_qs, current_user_id=None):
    """Build list of post dicts for feed. Solves include userId for cache; add mine when serving."""
    posts_list = []
    for post in posts_qs:
        author_id = _node_id(post.user)
        solves_list = []
        for s in post.solves.all():
            solve_data = {
                "nodeId": _node_id(s.user),
                "text": s.text,
                "time": _time_ago(s.created_at),
            }
            if current_user_id is not None:
                solve_data["mine"] = (s.user_id == current_user_id)
            else:
                solve_data["userId"] = s.user_id
            solves_list.append(solve_data)
        posts_list.append({
            "id": str(post.id),
            "nodeId": author_id,
            "text": post.text,
            "media": None,
            "time": _time_ago(post.created_at),
            "solves": solves_list,
        })
    return posts_list


def _feed_posts_from_cache(request):
    """Get feed posts from cache; add per-user 'mine' and return list ready for JSON (no mutation of cache)."""
    raw = cache.get(FEED_CACHE_KEY)
    if raw is None:
        return None
    posts_list = []
    for post in raw:
        posts_list.append({
            "id": post["id"],
            "nodeId": post["nodeId"],
            "text": post["text"],
            "media": post.get("media"),
            "time": post["time"],
            "solves": [
                {"nodeId": s["nodeId"], "text": s["text"], "time": s["time"], "mine": s.get("userId") == request.user.id}
                for s in post["solves"]
            ],
        })
    return posts_list


def _feed_posts_from_db(request):
    """Load feed from DB, cache it, return list with 'mine' set."""
    posts_qs = Post.objects.prefetch_related('solves__user').select_related('user').order_by('-created_at')
    posts_list = _build_feed_posts_list(posts_qs, current_user_id=request.user.id)
    # Cache raw data (with userId instead of mine) for next request
    raw_for_cache = _build_feed_posts_list(posts_qs, current_user_id=None)
    cache.set(FEED_CACHE_KEY, raw_for_cache, FEED_CACHE_TIMEOUT)
    return posts_list


def _invalidate_feed_cache():
    cache.delete(FEED_CACHE_KEY)


@login_required(login_url='/signin')
def home(request):
    node_id = _node_id(request.user)
    posts_list = _feed_posts_from_cache(request)
    if posts_list is None:
        posts_list = _feed_posts_from_db(request)
    posts_json = json.dumps(posts_list)
    return render(request, 'home.html', {'node_id': node_id, 'posts_json': posts_json})


@require_http_methods(["POST"])
@login_required(login_url='/signin')
def create_post(request):
    try:
        body = json.loads(request.body)
        text = (body.get("text") or "").strip()
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"success": False, "error": "Invalid JSON"}, status=400)
    if len(text) < 10:
        return JsonResponse({"success": False, "error": "Post must be at least 10 characters"}, status=400)
    if len(text) > 500:
        return JsonResponse({"success": False, "error": "Post must be at most 500 characters"}, status=400)
    post = Post.objects.create(user=request.user, text=text)
    _invalidate_feed_cache()
    return JsonResponse({
        "success": True,
        "post": {
            "id": str(post.id),
            "nodeId": _node_id(request.user),
            "text": post.text,
            "media": None,
            "time": "Just now",
            "solves": [],
        },
    })


@require_http_methods(["POST"])
@login_required(login_url='/signin')
def add_solve(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"success": False, "error": "Post not found"}, status=404)
    try:
        body = json.loads(request.body)
        text = (body.get("text") or "").strip()
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"success": False, "error": "Invalid JSON"}, status=400)
    if len(text) < 5:
        return JsonResponse({"success": False, "error": "Solution must be at least 5 characters"}, status=400)
    if len(text) > 400:
        return JsonResponse({"success": False, "error": "Solution must be at most 400 characters"}, status=400)
    solve = Solve.objects.create(post=post, user=request.user, text=text)
    _invalidate_feed_cache()
    return JsonResponse({
        "success": True,
        "solve": {
            "nodeId": _node_id(request.user),
            "text": solve.text,
            "time": "Just now",
            "mine": True,
        },
    })


def logout_view(request):
    logout(request)
    return redirect('signin')
