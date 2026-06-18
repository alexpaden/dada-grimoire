from django.db import models

from accounts.models import Identity


class Post(models.Model):
    author = models.ForeignKey(Identity, related_name='posts', on_delete=models.CASCADE)
    body_raw = models.TextField()
    body_html = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    reported = models.BooleanField(default=False)
    report_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post {self.pk} by {self.author.handle}"


class Comment(models.Model):
    post = models.ForeignKey(Post, related_name='comments', on_delete=models.CASCADE)
    author = models.ForeignKey(Identity, related_name='comments', on_delete=models.CASCADE)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment {self.pk} on Post {self.post_id}"
