def rows_for_query(cur, term, order_key):
    cur.execute(
        "SELECT id, handle, bio FROM identity_lookup(%s, %s)",
        [term[:128], order_key],
    )
    return cur.fetchall()
