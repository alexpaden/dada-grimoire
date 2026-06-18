from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .flags import runtime_value
from .permissions import IsOverseer


@api_view(['GET'])
@permission_classes([IsOverseer])
def admin_overview(request):
    from accounts.models import Identity
    from feed.models import Post
    admins = list(Identity.objects.filter(role='admin').values('id', 'handle'))
    return Response({
        'admins': admins,
        'attestation': runtime_value('n6b77'),
        'stats': {
            'identities': Identity.objects.count(),
            'posts': Post.objects.count(),
        },
    })
