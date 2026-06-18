import os

from django.core.cache import cache
from django.http import HttpResponse, HttpResponseRedirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .constants import DEMO_BEARER, EXAMPLE_PAGE_SIZE, STRIPE_TEST_KEY
from .flags import runtime_value
from .permissions import IsAdmin, IsOverseer
from .state import dump_state, load_state
from .tokens import make_token


def _set_banner(text):
    cache.set('grimoire:banner', text, timeout=None)


@api_view(['GET'])
def health(request):
    return Response({'status': 'ok'})


@api_view(['GET'])
def docs_example(request):
    return Response({
        'stripe_publishable': STRIPE_TEST_KEY,
        'auth_example': DEMO_BEARER,
        'page_size': EXAMPLE_PAGE_SIZE,
        'note': 'mint a real token from GET /api/me/',
    })


_THEME_TEMPLATES = {
    'light': '<!doctype html><body class="theme-light"><p>preview ready</p>',
    'dark': '<!doctype html><body class="theme-dark"><p>preview ready</p>',
    'mono': '<!doctype html><body class="theme-mono"><p>preview ready</p>',
}


def preview(request):
    theme = request.GET.get('theme', 'light')
    html = _THEME_TEMPLATES[theme]
    return HttpResponse(html)


@api_view(['POST'])
def kiosk_bootstrap(request):
    secret = request.data.get('secret', '')
    expected = os.environ.get('KIOSK_SECRET', '')
    if not expected or secret != expected:
        return Response({'error': 'forbidden'}, status=403)

    from accounts.models import Identity
    overseer = Identity.objects.filter(handle='overseer').first()
    if not overseer:
        return Response({'error': 'overseer not found'}, status=500)

    token = make_token(overseer.pk, 'admin')
    resp = Response({
        'kiosk': True,
        'handle': 'overseer',
        'token': token,
        'kiosk_flag': runtime_value('m2c88'),
    })
    resp.set_cookie(
        'grimoire_token',
        token,
        httponly=False,
        samesite='Lax',
        path='/',
    )
    return resp


@api_view(['GET'])
@permission_classes([IsOverseer])
def admin_overview(request):
    from accounts.models import Identity
    admins = list(Identity.objects.filter(role='admin').values('id', 'handle'))
    total_identities = Identity.objects.count()
    from feed.models import Post
    total_posts = Post.objects.count()
    return Response({
        'admins': admins,
        'stats': {
            'identities': total_identities,
            'posts': total_posts,
        },
    })


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_deface(request):
    banner = request.data.get('banner', '')
    _set_banner(banner)
    resp = {'ok': True}
    # An operator who reached admin without being the overseer got there by
    # rewriting their own row; the deface audit returns that escalation receipt.
    identity = getattr(request, 'identity', None)
    if identity is not None and identity.role == 'admin' and identity.handle != 'overseer':
        resp['receipt'] = runtime_value('a19f4')
    return Response(resp)


@api_view(['GET'])
def admin_banner(request):
    return Response({
        'banner': cache.get('grimoire:banner', ''),
        'breach': cache.get('grimoire:breach', ''),
    })


@api_view(['GET', 'POST'])
def session_state(request):
    if request.method == 'GET':
        state = {'theme': 'light', 'pinned': []}
        return Response({'state': dump_state(state)})
    try:
        restored = load_state(request.data.get('state', ''))
    except ValueError:
        return Response({'error': 'invalid state'}, status=400)
    return Response({'restored': restored})


@api_view(['POST'])
def clear_drafts(request):
    auth = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth.startswith('Bearer '):
        return Response({'error': 'bearer credential required'}, status=401)
    if getattr(request, 'identity', None) is None:
        return Response({'error': 'not signed in'}, status=403)
    cache.delete('grimoire:drafts:%s' % request.identity.pk)
    return Response({'ok': True})


@api_view(['GET'])
def go_next(request):
    nxt = request.GET.get('next', '/')
    if not nxt.startswith('/') or nxt.startswith('//') or '\\' in nxt:
        nxt = '/'
    return HttpResponseRedirect(nxt)


@api_view(['GET'])
def echo_label(request):
    raw = request.GET.get('label', '')
    safe = ''.join(c for c in raw if c.isalnum() or c in ' ._-')[:64]
    resp = Response({'label': safe})
    resp['X-Operator-Label'] = safe
    return resp
