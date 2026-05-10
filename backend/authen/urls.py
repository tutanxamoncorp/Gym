from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register),
    path('login/',    views.login),
    path('workouts/', views.workouts),
    path('workouts/<int:workout_id>/', views.workout_delete),
]