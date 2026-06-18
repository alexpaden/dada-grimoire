from django.urls import path
from . import views

urlpatterns = [
    path('posts/', views.posts_list_create, name='posts_list_create'),
    path('posts/<int:id>/', views.post_detail, name='post_detail'),
    path('posts/<int:id>/report/', views.post_report, name='post_report'),
    path('posts/<int:id>/comments/', views.post_comment, name='post_comment'),
    path('reports/', views.reports_list, name='reports_list'),
]
