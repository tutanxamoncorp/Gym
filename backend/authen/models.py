from django.db import models
import json

class User(models.Model):
    login    = models.CharField(max_length=50, unique=True)
    password = models.CharField(max_length=100)

    def __str__(self):
        return self.login

class Workout(models.Model):
    user      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workouts')
    name      = models.CharField(max_length=100)
    date      = models.CharField(max_length=10)
    duration  = models.CharField(max_length=10, blank=True, default='')
    notes     = models.TextField(blank=True, default='')
    exercises = models.TextField(default='[]')  # JSON список упражнений

    def exercises_list(self):
        return json.loads(self.exercises)