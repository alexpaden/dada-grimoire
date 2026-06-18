from django.urls import path
from . import views

urlpatterns = [
    path('me/preset/', views.view_preset, name='view_preset'),
]
