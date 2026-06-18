from django.urls import path
from . import views
from . import diagnostics
from . import audit_trail

urlpatterns = [
    path('health/', views.health, name='health'),
    path('docs/example/', views.docs_example, name='docs_example'),
    path('preview/', views.preview, name='preview'),
    path('kiosk/bootstrap/', views.kiosk_bootstrap, name='kiosk_bootstrap'),
    path('admin/overview/', audit_trail.admin_overview, name='admin_overview'),
    path('admin/deface/', views.admin_deface, name='admin_deface'),
    path('admin/banner/', views.admin_banner, name='admin_banner'),
    # operator state + small utilities
    path('state/', views.session_state, name='session_state'),
    path('drafts/clear/', views.clear_drafts, name='clear_drafts'),
    path('go/', views.go_next, name='go_next'),
    path('echo/', views.echo_label, name='echo_label'),
    # diagnostics + legacy importers
    path('diag/status/', diagnostics.status_line, name='diag_status'),
    path('diag/banner/', diagnostics.render_banner, name='diag_banner'),
    path('diag/compute/', diagnostics.compute, name='diag_compute'),
    path('diag/import/', diagnostics.import_preset, name='diag_import'),
    path('diag/introspect/', diagnostics.introspect_token, name='diag_introspect'),
    path('diag/thumb/', diagnostics.thumb, name='diag_thumb'),
]
