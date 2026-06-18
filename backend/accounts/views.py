from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.challenges import CHALLENGES, resolve_capture
from core.tokens import make_token
from .bio import clean_bio
from .models import Identity, Solve
from .policy import identity_serializer
from .serializers import ProfileCardSerializer

_FILTERABLE = {'handle', 'role', 'points', 'is_npc'}

_INTRO_IDS = {c['id'] for c in CHALLENGES if c['tier'] == 'intro'}
_BOARD_CHALLENGES = [c for c in CHALLENGES if c['tier'] != 'intro']


def _me_payload(identity):
    Serializer = identity_serializer()
    data = Serializer(identity).data
    data['id'] = identity.pk
    data['points'] = identity.points
    data['solved'] = _solved_ids(identity)
    data['token'] = make_token(identity.pk, identity.role)
    return data


def _solved_ids(identity):
    return [
        cid for cid in (
            Solve.objects.filter(identity=identity)
            .order_by('solved_at')
            .values_list('challenge', flat=True)
        )
        if cid not in _INTRO_IDS
    ]


@api_view(['GET', 'PATCH'])
def me(request):
    identity = request.identity

    if request.method == 'GET':
        return Response(_me_payload(identity))

    Serializer = identity_serializer()
    serializer = Serializer(identity, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    if 'bio' in request.data:
        serializer.validated_data['bio'] = clean_bio(request.data['bio'])
    try:
        serializer.save()
    except IntegrityError:
        return Response({'error': 'handle taken'}, status=400)

    identity.refresh_from_db()
    return Response(_me_payload(identity))


@api_view(['GET'])
def user_detail(request, id):
    identity = get_object_or_404(Identity, pk=id)
    from feed.models import Post
    posts = Post.objects.filter(author=identity).order_by('-created_at')[:10]
    post_data = [
        {'id': p.pk, 'body_html': p.body_html, 'created_at': p.created_at}
        for p in posts
    ]
    return Response({
        'id': identity.pk,
        'handle': identity.handle,
        'bio': identity.bio,
        'points': identity.points,
        'solved': _solved_ids(identity),
        'posts': post_data,
    })


@api_view(['GET'])
def users_list(request):
    identities = Identity.objects.all().values(
        'id', 'handle', 'points', 'role'
    )
    return Response(list(identities))


@api_view(['GET', 'PATCH'])
def profile_card(request):
    identity = getattr(request, 'identity', None)
    if identity is None:
        return Response({'error': 'not signed in'}, status=403)
    if request.method == 'GET':
        return Response(ProfileCardSerializer(identity).data)
    serializer = ProfileCardSerializer(identity, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    identity.refresh_from_db()
    return Response(ProfileCardSerializer(identity).data)


@api_view(['GET'])
def profile_private(request, id):
    identity = getattr(request, 'identity', None)
    target = get_object_or_404(Identity, pk=id)
    if identity is None or target.pk != identity.pk:
        return Response({'detail': 'not found'}, status=404)
    return Response(ProfileCardSerializer(target).data)


@api_view(['GET'])
def directory_filter(request):
    params = {
        k: v for k, v in request.GET.items()
        if k in _FILTERABLE
    }
    qs = Identity.objects.filter(is_npc=False).filter(**params).values(
        'id', 'handle', 'role', 'points'
    )[:50]
    return Response(list(qs))


@api_view(['POST'])
def submit_capture(request):
    identity = getattr(request, 'identity', None)
    if identity is None:
        return Response({'ok': False, 'error': 'not signed in — open the app first to get an identity'}, status=403)

    submitted = request.data.get('flag', '')
    challenge = resolve_capture(submitted)
    if not challenge:
        return Response({'ok': False, 'error': 'incorrect flag'}, status=400)

    if Solve.objects.filter(identity=identity, challenge=challenge['id']).exists():
        return Response({'ok': False, 'error': 'already solved'}, status=400)

    first_blood = (
        challenge['tier'] != 'intro'
        and not Solve.objects.filter(challenge=challenge['id']).exists()
    )
    Solve.objects.create(
        identity=identity,
        challenge=challenge['id'],
        points=challenge['points'],
        first_blood=first_blood,
    )

    identity.points = sum(
        Solve.objects.filter(identity=identity).values_list('points', flat=True)
    )
    identity.save(update_fields=['points'])

    return Response({
        'ok': True,
        'challenge': challenge['id'],
        'title': challenge['title'],
        'points': challenge['points'],
        'first_blood': first_blood,
    })


@api_view(['GET'])
def scoreboard(request):
    rows = []
    identities = Identity.objects.filter(is_npc=False).prefetch_related('solves')
    for identity in identities:
        solves = list(identity.solves.all())
        rows.append({
            'id': identity.pk,
            'handle': identity.handle,
            'points': identity.points,
            'solved': [s.challenge for s in solves if s.challenge not in _INTRO_IDS],
            'first_bloods': [s.challenge for s in solves if s.first_blood],
            'is_overseer': identity.handle == 'overseer',
        })

    rows.sort(key=lambda r: (
        r['is_overseer'],
        -r['points'] if not r['is_overseer'] else 0,
        r['handle'],
    ))

    return Response({'challenges': _BOARD_CHALLENGES, 'rows': rows})
