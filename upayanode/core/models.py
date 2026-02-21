from django.db import models
from django.contrib.auth.models import User


class Identity(models.Model):
    """
    Anonymous identity keyed only by a hashed passphrase.
    Links to Django's User for session/auth (request.user, @login_required).
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='identity',
        null=False,
    )
    node_id = models.CharField(max_length=32, unique=True)  # e.g. "Node #1234"
    passphrase_hash = models.CharField(max_length=128)     # hashed with Django's make_password
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Identities'

    def __str__(self):
        return self.node_id


class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Posts'
        ordering = ['-created_at']

    def __str__(self):
        return self.text[:50] + '…' if len(self.text) > 50 else self.text


class Solve(models.Model):
    """A solution/response to a problem post."""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='solves')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='solves')
    text = models.TextField(max_length=400)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Solves'
        ordering = ['created_at']

    def __str__(self):
        return self.text[:50] + '…' if len(self.text) > 50 else self.text