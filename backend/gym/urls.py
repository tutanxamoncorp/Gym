from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def index(request):
    return JsonResponse({
        'name': 'IronLog API',
        'version': '1.0',
        'status': 'running',
        'endpoints': [
            '/api/register/',
            '/api/login/',
            '/api/workouts/',
        ]
    })

urlpatterns = [
    path('', index),
    path('admin/', admin.site.urls),
    path('api/', include('authen.urls')),
]
