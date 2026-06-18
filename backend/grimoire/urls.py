from django.urls import path, include

urlpatterns = [
    path('api/', include('core.urls')),
    path('api/', include('accounts.urls')),
    path('api/', include('feed.urls')),
    path('api/', include('search.urls')),
    path('api/', include('layouts.urls')),
]
