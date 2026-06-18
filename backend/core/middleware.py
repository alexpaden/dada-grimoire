from faker import Faker
from .tokens import make_token, read_token

_faker = Faker()


def _load_or_create_identity(token_str):
    from accounts.models import Identity
    try:
        payload = read_token(token_str)
        identity = Identity.objects.get(pk=payload['sub'])
        return identity, payload.get('role', 'user')
    except Exception:
        return None, 'user'


def _create_fresh_identity():
    from accounts.models import Identity
    handle = _faker.user_name() + str(_faker.random_int(100, 9999))
    # keep handle unique
    while Identity.objects.filter(handle=handle).exists():
        handle = _faker.user_name() + str(_faker.random_int(100, 9999))
    identity = Identity.objects.create(handle=handle)
    return identity


class IdentityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        token_str = None

        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token_str = auth_header[7:]

        if not token_str:
            token_str = request.COOKIES.get('grimoire_token', '')

        identity = None
        token_role = 'user'
        new_token = None

        if token_str:
            identity, token_role = _load_or_create_identity(token_str)

        # Lazy-mint a visitor identity ONLY on the bootstrap endpoint (/api/me).
        # Every other path stays anonymous when tokenless, so polling/health/scanner
        # hits (and the /tv leaderboard poll) don't spawn ghost accounts that would
        # clutter the board. The frontend always calls /api/me first to get a token.
        if identity is None and request.path in ('/api/me/', '/api/me'):
            identity = _create_fresh_identity()
            new_token = make_token(identity.pk, identity.role)
            token_role = identity.role

        request.identity = identity
        request.token_role = token_role

        response = self.get_response(request)

        if new_token:
            response.set_cookie(
                'grimoire_token',
                new_token,
                httponly=False,
                samesite='Lax',
                path='/',
            )

        return response


class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        identity = getattr(request, 'identity', None)
        handle = identity.handle if identity else 'anon'
        role = getattr(request, 'token_role', 'user')
        print(f"{response.status_code} {request.method} {request.path} id={handle} role={role}")
        return response
