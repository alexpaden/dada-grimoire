from django.db import connection
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .identity_lookup import rows_for_query


@api_view(["GET"])
def search(request):
    raw = request.GET.get("q", "")
    order_key = request.GET.get("sort", "handle")
    if order_key not in ("handle", "id", "points"):
        order_key = "handle"

    with connection.cursor() as cur:
        rows = rows_for_query(cur, raw, order_key)

    return Response([
        {"id": r[0], "handle": r[1], "bio": r[2]}
        for r in rows
    ])
