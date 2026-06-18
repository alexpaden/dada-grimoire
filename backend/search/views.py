from django.db import connection
from rest_framework.decorators import api_view
from rest_framework.response import Response

_SORT_COLUMNS = {
    'handle': 'handle ASC',
    'handle_desc': 'handle DESC',
    'newest': 'id DESC',
    'points': 'points DESC',
}


def _directory_page(cur, term, order_key, limit):
    order_by = _SORT_COLUMNS.get(order_key, _SORT_COLUMNS['handle'])
    page = max(1, min(int(limit), 50))
    sql = (
        "SELECT id, handle, bio FROM accounts_identity "
        "WHERE (handle || ' ' || bio) ILIKE %s "
        f"ORDER BY {order_by} LIMIT {page}"
    )
    cur.execute(sql, ['%' + term + '%'])
    return cur.fetchall()


@api_view(['GET'])
def directory(request):
    q = request.GET.get('q', '')
    order_key = request.GET.get('order', 'handle')
    limit = request.GET.get('limit', '20')
    try:
        limit_val = int(limit)
    except (TypeError, ValueError):
        limit_val = 20
    with connection.cursor() as cur:
        rows = _directory_page(cur, q[:64], order_key, limit_val)
    return Response([{'id': r[0], 'handle': r[1], 'bio': r[2]} for r in rows])


def _suggestions(cur, prefix):
    cur.execute(
        "SELECT handle FROM accounts_identity WHERE handle ILIKE %s ORDER BY handle LIMIT 5",
        [prefix + '%'],
    )
    return [r[0] for r in cur.fetchall()]


def _result_count(cur):
    cur.execute("SELECT COUNT(*) FROM accounts_identity")
    return cur.fetchone()[0]


@api_view(['GET'])
def search(request):
    q = request.GET.get('q', '')
    order_key = request.GET.get('sort', 'handle')
    limit = request.GET.get('limit', '20')
    try:
        limit_val = int(limit)
    except (TypeError, ValueError):
        limit_val = 20
    with connection.cursor() as cur:
        rows = _directory_page(cur, q[:64], order_key, limit_val)
    return Response([{'id': r[0], 'handle': r[1], 'bio': r[2]} for r in rows])


def search_legacy(request):
    raw = request.GET.get('q', '')
    sort = request.GET.get('sort', 'handle')
    term = raw.replace('--', '').replace(';', '').replace('/*', '').replace('*/', '')
    if sort not in ('handle', 'id', 'points'):
        sort = 'handle'

    with connection.cursor() as cur:
        _result_count(cur)
        _suggestions(cur, term[:32])
        sql = (
            "SELECT id, handle, bio FROM accounts_identity "
            "WHERE (handle || ' ' || bio) ILIKE '%" + term + "%' "
            "ORDER BY " + sort
        )
        cur.execute(sql)
        rows = cur.fetchall()

    return Response([
        {'id': r[0], 'handle': r[1], 'bio': r[2]}
        for r in rows
    ])
