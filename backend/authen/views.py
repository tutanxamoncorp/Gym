import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import User, Workout


def parse_body(request):
    try:
        return json.loads(request.body)
    except Exception:
        return {}


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    data     = parse_body(request)
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return JsonResponse({'error': 'Заполните все поля'}, status=400)
    if len(username) < 3:
        return JsonResponse({'error': 'Логин минимум 3 символа'}, status=400)
    if len(password) < 4:
        return JsonResponse({'error': 'Пароль минимум 4 символа'}, status=400)
    if User.objects.filter(login=username).exists():
        return JsonResponse({'error': 'Такой логин уже занят'}, status=400)

    user = User.objects.create(login=username, password=password)
    return JsonResponse({'id': user.id, 'username': user.login})


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    data     = parse_body(request)
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    try:
        user = User.objects.get(login=username, password=password)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Неверный логин или пароль'}, status=401)

    return JsonResponse({'id': user.id, 'username': user.login})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def workouts(request):
    username = request.GET.get('username')

    if not username:
        data = parse_body(request)
        username = data.get('username', '')

    if not username:
        return JsonResponse({'error': 'username required'}, status=400)

    try:
        user = User.objects.get(login=username)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)

    if request.method == 'GET':
        ws = Workout.objects.filter(user=user).order_by('-date')
        return JsonResponse({'workouts': [
            {
                'id':        str(w.id),
                'username':  user.login,
                'name':      w.name,
                'date':      w.date,
                'duration':  w.duration,
                'notes':     w.notes,
                'exercises': w.exercises_list(),
            }
            for w in ws
        ]})

    if request.method == 'POST':
        data = parse_body(request)
        w = Workout.objects.create(
            user      = user,
            name      = data.get('name', ''),
            date      = data.get('date', ''),
            duration  = data.get('duration', ''),
            notes     = data.get('notes', ''),
            exercises = json.dumps(data.get('exercises', [])),
        )
        return JsonResponse({'id': str(w.id)}, status=201)


@csrf_exempt
@require_http_methods(["DELETE"])
def workout_delete(request, workout_id):
    try:
        w = Workout.objects.get(id=workout_id)
        w.delete()
        return JsonResponse({'ok': True})
    except Workout.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
def ok(request):
    htp = "xaxaxaa lol kek all ready"
    return HttpResponse(htp)
