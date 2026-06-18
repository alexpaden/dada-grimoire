from django.urls import path
from . import views

urlpatterns = [
    path('me/', views.me, name='me'),
    path('me/card/', views.profile_card, name='profile_card'),
    path('users/', views.users_list, name='users_list'),
    path('users/filter/', views.directory_filter, name='directory_filter'),
    path('u/<int:id>/', views.user_detail, name='user_detail'),
    path('u/<int:id>/card/', views.profile_private, name='profile_private'),
    path('submit/', views.submit_capture, name='submit_capture'),
    path('scoreboard/', views.scoreboard, name='scoreboard'),
]
