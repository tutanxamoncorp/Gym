import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import User, Workout


def cors(response):
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, POST, DELETE, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


def parse_body(request):
    try:
        return json.loads(request.body)
    except Exception:
        return {}


@csrf_exempt
def register(request):
    if request.method == 'OPTIONS':
        return cors(JsonResponse({}))
    if request.method != 'POST':
        return cors(JsonResponse({'error': 'Method not allowed'}, status=405))

    data     = parse_body(request)
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return cors(JsonResponse({'error': 'Заполните все поля'}, status=400))
    if len(username) < 3:
        return cors(JsonResponse({'error': 'Логин минимум 3 символа'}, status=400))
    if len(password) < 4:
        return cors(JsonResponse({'error': 'Пароль минимум 4 символа'}, status=400))
    if User.objects.filter(login=username).exists():
        return cors(JsonResponse({'error': 'Такой логин уже занят'}, status=400))

    user = User.objects.create(login=username, password=password)
    return cors(JsonResponse({'id': user.id, 'username': user.login}))


@csrf_exempt
def login(request):
    if request.method == 'OPTIONS':
        return cors(JsonResponse({}))
    if request.method != 'POST':
        return cors(JsonResponse({'error': 'Method not allowed'}, status=405))

    data     = parse_body(request)
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    try:
        user = User.objects.get(login=username, password=password)
    except User.DoesNotExist:
        return cors(JsonResponse({'error': 'Неверный логин или пароль'}, status=401))

    return cors(JsonResponse({'id': user.id, 'username': user.login}))


@csrf_exempt
def workouts(request):
    if request.method == 'OPTIONS':
        return cors(JsonResponse({}))

    username = request.GET.get('username')
    if not username:
        data = parse_body(request)
        username = data.get('username', '')

    if not username:
        return cors(JsonResponse({'error': 'username required'}, status=400))

    try:
        user = User.objects.get(login=username)
    except User.DoesNotExist:
        return cors(JsonResponse({'error': 'User not found'}, status=404))

    if request.method == 'GET':
        ws = Workout.objects.filter(user=user).order_by('-date')
        return cors(JsonResponse({'workouts': [
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
        ]}))

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
        return cors(JsonResponse({'id': str(w.id)}, status=201))

    return cors(JsonResponse({'error': 'Method not allowed'}, status=405))


@csrf_exempt
def workout_delete(request, workout_id):
    if request.method == 'OPTIONS':
        return cors(JsonResponse({}))
    if request.method != 'DELETE':
        return cors(JsonResponse({'error': 'Method not allowed'}, status=405))

    try:
        w = Workout.objects.get(id=workout_id)
        w.delete()
        return cors(JsonResponse({'ok': True}))
    except Workout.DoesNotExist:
        return cors(JsonResponse({'error': 'Not found'}, status=404))