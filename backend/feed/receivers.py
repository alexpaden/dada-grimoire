import hashlib

from django.core.cache import cache
from django.db.models.signals import post_save
from django.dispatch import receiver

from core.events import emit, on_event
from .models import Post


@receiver(post_save, sender=Post)
def post_row_saved(sender, instance, update_fields=None, **kwargs):
    if update_fields and "body_raw" not in update_fields:
        return
    emit("feed.post.stored", post_id=instance.pk, body=instance.body_raw)


@on_event("feed.post.stored")
def write_render_snapshot(post_id, body, **kwargs):
    from .policy import sanitize_post

    Post.objects.filter(pk=post_id).update(body_html=sanitize_post(body or ""))


@on_event("feed.post.stored")
def remember_dispatch_digest(post_id, body, **kwargs):
    digest = hashlib.sha256((body or "").encode()).hexdigest()[:16]
    cache.set(f"grimoire:dispatch:{post_id}:digest", digest, timeout=None)


@on_event("feed.post.reported")
def note_reported_dispatch(post_id, **kwargs):
    cache.set("grimoire:last_reported", post_id, timeout=None)
