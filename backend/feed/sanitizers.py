import re
import bleach

ALLOWED_TAGS = ['p','br','b','i','em','strong','a','code','pre','blockquote',
                'ul','ol','li','img','iframe','span','h1','h2','h3']
ALLOWED_ATTRS = {
    'a': ['href', 'title'],
    'img': ['src', 'alt', 'title'],
    'iframe': ['src', 'title', 'width', 'height'],
    'span': ['class'],
}
SANDBOX = 'allow-same-origin'

def sanitize_post(raw: str) -> str:
    clean = bleach.clean(raw, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)
    clean = re.sub(r'(<iframe\b[^>]*?)\s*>', r'\1 sandbox="%s">' % SANDBOX, clean)
    return clean
