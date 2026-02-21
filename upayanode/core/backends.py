from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password
from .models import Identity


class PassphraseAuthBackend(BaseBackend):
    """
    Authenticate by passphrase: find Identity whose hashed passphrase matches.
    """

    def authenticate(self, request, passphrase=None, **kwargs):
        if not passphrase or not passphrase.strip():
            return None
        passphrase = passphrase.strip()
        for identity in Identity.objects.select_related('user').all():
            if check_password(passphrase, identity.passphrase_hash):
                return identity.user
        return None

    def get_user(self, user_id):
        from django.contrib.auth.models import User
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
