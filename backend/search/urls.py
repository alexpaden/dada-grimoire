from django.urls import path
from . import views
from . import compat_plan_cache

urlpatterns = [
    path('search/', compat_plan_cache.search, name='search'),
    path('search/preview/', views.search, name='search_preview'),
    path('directory/', views.directory, name='directory'),
]
