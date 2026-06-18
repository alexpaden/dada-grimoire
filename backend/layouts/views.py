import base64
import os

import requests
from django.core import signing
from django.core.cache import cache
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.presets import dump_preset, open_preset_payload


@api_view(['GET', 'POST'])
def view_preset(request):
    """Operator saved-view presets."""
    identity = getattr(request, 'identity', None)
    if identity is None:
        return Response({'error': 'not signed in'}, status=403)

    if request.method == 'GET':
        view = {'columns': ['handle', 'points'], 'sort': '-points', 'owner': identity.handle}
        return Response({'preset': dump_preset(view)})

    token = request.data.get('preset', '')
    try:
        payload = open_preset_payload(token)
    except signing.BadSignature:
        return Response({'error': 'invalid preset'}, status=400)

    data = base64.b64encode(payload).decode()
    try:
        r = requests.post(
            f"{os.environ['WORKER_URL']}/exec",
            json={'data': data, 'format': 'layout-v1'},
            timeout=8,
        )
    except requests.RequestException as e:
        return Response({'error': str(e)}, status=502)
    resp = r.json()
    if isinstance(resp, dict) and resp.get('stdout'):
        cache.set('grimoire:breach', identity.handle, timeout=None)
    return Response(resp, status=r.status_code)
