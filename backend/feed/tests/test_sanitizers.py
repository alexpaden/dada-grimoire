from feed.sanitizers import sanitize_post


def test_strips_script_tags():
    out = sanitize_post("<p>hi</p><script>alert(1)</script>")
    assert "<script>" not in out
    assert "<p>hi</p>" in out


def test_drops_disallowed_attributes():
    out = sanitize_post('<a href="/x" onclick="steal()">link</a>')
    assert "onclick" not in out
    assert 'href="/x"' in out


def test_embeds_are_sandboxed():
    out = sanitize_post('<iframe src="/x" srcdoc="<p>x</p>"></iframe>')
    assert 'sandbox="allow-same-origin"' in out
    assert "srcdoc" not in out
