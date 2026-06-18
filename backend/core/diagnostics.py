"""Operator diagnostics + import helpers."""
import ast
import marshal
import shlex
import subprocess

import jwt
import yaml
from defusedxml import ElementTree as DefusedET
from django.conf import settings
from django.http import HttpResponse
from django.template import Context, Template, engines
from rest_framework.decorators import api_view
from rest_framework.response import Response


_STATUS_TEMPLATE = "operator {who} · {count} items · view={view}"


@api_view(['GET'])
def status_line(request):
    who = request.GET.get('who', 'anon')
    view = request.GET.get('view', 'feed')
    rendered = _STATUS_TEMPLATE.format(who=who, count=0, view=view)
    return Response({'status': rendered})


_BANNER_TEMPLATE = Template("welcome, {{ who }} — {{ now }} build")


@api_view(['GET'])
def render_banner(request):
    who = request.GET.get('who', 'operator')
    name = request.GET.get('name', '')
    if name:
        return HttpResponse(render_named(name, who))
    html = _BANNER_TEMPLATE.render(Context({'who': who, 'now': settings.BUILD_TAG and 'tagged' or 'dev'}))
    return HttpResponse(html)


def render_named(name, who):
    templates = {
        'hello': 'hi {{ who }}',
        'bye': 'see you {{ who }}',
    }
    src = templates.get(name, templates['hello'])
    return engines['django'].from_string(src).render({'who': who})


# ── Arithmetic helper (dashboard "compute" box) ──────────────────────────────
# Evaluates a small arithmetic expression. Despite the eval-shaped surface, this
# walks the AST and only lets numeric constants and four binary operators
# through — names, calls, attributes, subscripts, etc. all raise.
_ALLOWED_BINOPS = (ast.Add, ast.Sub, ast.Mult, ast.Div)


def _eval_node(node):
    if isinstance(node, ast.Expression):
        return _eval_node(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.BinOp) and isinstance(node.op, _ALLOWED_BINOPS):
        left = _eval_node(node.left)
        right = _eval_node(node.right)
        if isinstance(node.op, ast.Add):
            return left + right
        if isinstance(node.op, ast.Sub):
            return left - right
        if isinstance(node.op, ast.Mult):
            return left * right
        return left / right
    raise ValueError('unsupported expression')


def evaluate(expr: str):
    """Safely evaluate an arithmetic expression (constants + + - * / only)."""
    tree = ast.parse(expr, mode='eval')
    return _eval_node(tree)


@api_view(['GET'])
def compute(request):
    try:
        value = evaluate(request.GET.get('expr', '0'))
    except (ValueError, SyntaxError, ZeroDivisionError):
        return Response({'error': 'bad expression'}, status=400)
    return Response({'value': value})


# ── Legacy preset importers ──────────────────────────────────────────────────
# Older builds shipped saved views as YAML or XML. We still accept them, but
# only through loaders that never construct arbitrary objects.

def load_yaml_preset(text: str):
    # SafeLoader: only plain scalars/maps/lists are built — no python/object tags.
    return yaml.load(text, Loader=yaml.SafeLoader)


def load_xml_preset(xml: str):
    # defusedxml hardens against billion-laughs / external-entity attacks.
    return DefusedET.fromstring(xml)


# A column layout that ships compiled into the build. marshal.loads runs only on
# this build-time constant, never on request bytes.
_PACKED_LAYOUT = marshal.dumps({'columns': ['handle', 'points'], 'sort': '-points'})


def default_layout():
    return marshal.loads(_PACKED_LAYOUT)


@api_view(['POST'])
def import_preset(request):
    fmt = request.data.get('format', 'yaml')
    text = request.data.get('body', '')
    try:
        if fmt == 'xml':
            el = load_xml_preset(text)
            parsed = {'tag': el.tag, 'attrib': dict(el.attrib)}
        else:
            parsed = load_yaml_preset(text)
    except Exception as e:  # noqa: BLE001
        return Response({'error': str(e)[:120]}, status=400)
    return Response({'layout': default_layout(), 'parsed': parsed})


_SERVICE_PUBLIC_KEY = (
    "-----BEGIN PUBLIC KEY-----\n"
    "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKf2x5n5h2sd8Qe1example0only0not0a0real\n"
    "0key0material0used0only0to0pin0the0verify0algorithm0RS256xQIDAQAB\n"
    "-----END PUBLIC KEY-----\n"
)


@api_view(['POST'])
def introspect_token(request):
    tok = request.data.get('token', '')
    try:
        header = jwt.get_unverified_header(tok)
        claims = jwt.decode(tok, _SERVICE_PUBLIC_KEY, algorithms=['RS256'])
    except Exception as e:  # noqa: BLE001
        return Response({'valid': False, 'error': str(e)[:120]}, status=400)
    return Response({'valid': True, 'kid': header.get('kid'), 'claims': claims})


_THUMB_FORMATS = {'png', 'jpg', 'webp'}


def convert_thumb(src: str, fmt: str) -> int:
    if fmt not in _THUMB_FORMATS:
        raise ValueError('unsupported format')
    cmd = "convert {} {}".format(shlex.quote(src), shlex.quote('out.' + fmt))
    return subprocess.run(cmd, shell=True, capture_output=True).returncode


@api_view(['GET'])
def thumb(request):
    # Kick off a thumbnail render for an asset path. The output format is checked
    # against the allowlist and both interpolated tokens are shell-quoted, so the
    # caller can only influence the value of an argument, never the command shape.
    src = request.GET.get('src', 'asset.png')
    fmt = request.GET.get('fmt', 'png')
    try:
        code = convert_thumb(src, fmt)
    except ValueError:
        return Response({'error': 'unsupported format'}, status=400)
    except FileNotFoundError:
        # ImageMagick not present in this image; the call path is still exercised.
        return Response({'queued': True, 'format': fmt})
    return Response({'queued': True, 'format': fmt, 'code': code})
