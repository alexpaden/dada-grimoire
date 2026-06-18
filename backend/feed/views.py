import hashlib
import random
from html import escape

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from core.permissions import IsAdmin
from core.events import emit
from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer

_GARNISH = ['quiet', 'humming', 'nominal', 'steady', 'drifting']


def _feed_etag(payload) -> str:
    digest = hashlib.md5(repr(payload).encode()).hexdigest()
    return f'W/"{digest}"'


@api_view(['GET', 'POST'])
def posts_list_create(request):
    if request.method == 'GET':
        posts = Post.objects.select_related('author').order_by('-created_at')
        serializer = PostSerializer(posts, many=True)
        data = serializer.data
        resp = Response(data)
        resp['ETag'] = _feed_etag(data)
        resp['X-Feed-Mood'] = random.choice(_GARNISH)
        return resp
    # POST
    return _post_create(request)


def _post_create(request):
    if request.identity is None:
        return Response({'detail': 'authentication required'}, status=403)
    body_raw = request.data.get('body_raw', '')
    post = Post.objects.create(
        author=request.identity,
        body_raw=body_raw,
        body_html='',
    )
    post.refresh_from_db()
    return Response(PostSerializer(post).data, status=201)


@api_view(['GET'])
def post_detail(request, id):
    post = get_object_or_404(Post, pk=id)
    comments = Comment.objects.filter(post=post).select_related('author').order_by('created_at')
    data = PostSerializer(post).data
    data['comments'] = CommentSerializer(comments, many=True).data
    return Response(data)


@api_view(['POST'])
def post_report(request, id):
    post = get_object_or_404(Post, pk=id)
    post.reported = True
    post.report_count += 1
    post.save(update_fields=['reported', 'report_count'])
    emit('feed.post.reported', post_id=post.pk)
    return Response({'ok': True})


@api_view(['POST'])
def post_comment(request, id):
    if request.identity is None:
        return Response({'detail': 'authentication required'}, status=403)
    post = get_object_or_404(Post, pk=id)
    body = escape(request.data.get('body', ''))
    comment = Comment.objects.create(
        post=post,
        author=request.identity,
        body=body,
    )
    return Response(CommentSerializer(comment).data, status=201)


@api_view(['GET'])
@permission_classes([IsAdmin])
def reports_list(request):
    reported_posts = Post.objects.filter(reported=True).select_related('author')
    return Response({
        'posts': PostSerializer(reported_posts, many=True).data,
    })
