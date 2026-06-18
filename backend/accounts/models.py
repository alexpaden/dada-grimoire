from django.db import models


class Identity(models.Model):
    handle = models.CharField(max_length=64, unique=True)
    role = models.CharField(max_length=16, default='user')
    bio = models.TextField(blank=True, default='')
    points = models.IntegerField(default=0)
    staff_note = models.TextField(blank=True, default='')
    is_npc = models.BooleanField(default=False)  # seed feed-author NPCs; hidden from the leaderboard
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'identities'

    def __str__(self):
        return self.handle


class Solve(models.Model):
    identity = models.ForeignKey(
        Identity, on_delete=models.CASCADE, related_name='solves'
    )
    challenge = models.CharField(max_length=8)
    points = models.IntegerField(default=0)
    first_blood = models.BooleanField(default=False)
    solved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('identity', 'challenge')

    def __str__(self):
        return f'{self.identity.handle} -> {self.challenge}'
