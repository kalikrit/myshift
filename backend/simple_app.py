from flask import Flask, jsonify, request
import json
import os
from auth import login_required, role_required, generate_token, verify_password, hash_password

app = Flask(__name__)

# Ручная настройка CORS
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Правила покрытия
COVERAGE_RULES = {
    "cashier": [
        {"start": "07:00", "end": "10:00", "min": 1, "max": 2},
        {"start": "10:00", "end": "14:00", "min": 2, "max": 3},
        {"start": "14:00", "end": "18:00", "min": 3, "max": 4},
        {"start": "18:00", "end": "20:00", "min": 2, "max": 3}
    ],
    "manager": [
        {"start": "08:00", "end": "12:00", "min": 1, "max": 2},
        {"start": "12:00", "end": "20:00", "min": 2, "max": 3}
    ],
    "technician": [
        {"start": "09:00", "end": "17:00", "min": 1, "max": 1}
    ]
}

# Endpoint для получения правил покрытия
@app.route('/coverage-rules', methods=['GET'])
@login_required
def get_coverage_rules():
    """Возвращает бизнес-правила покрытия персоналом"""
    # Преобразуем в формат массива как на фронтенде
    rules_array = [
        {
            "role": "cashier",
            "displayName": "Кассир",
            "totalRequired": 2,
            "minPerInterval": 1,
            "intervals": COVERAGE_RULES["cashier"]
        },
        {
            "role": "manager",
            "displayName": "Менеджер зала",
            "totalRequired": 2,
            "minPerInterval": 1,
            "intervals": COVERAGE_RULES["manager"]
        },
        {
            "role": "technician",
            "displayName": "Техник",
            "totalRequired": 1,
            "minPerInterval": 1,
            "intervals": COVERAGE_RULES["technician"]
        }
    ]
    return jsonify(rules_array)


def generate_shifts_for_date(date):
    """Генерирует оптимальные смены с уникальными ID"""
    shifts = []

    employees = {
        'cashier': ['кассир1', 'кассир2', 'кассир3', 'кассир4', 'кассир5'],
        'manager': ['менеджер зала 1', 'менеджер зала 2', 'менеджер зала 3'],
        'technician': ['техник1', 'техник2']
    }

    # Создаем базовый ID из даты (например: 202511230001)
    base_id = int(date.replace("-", "")) * 10000
    shift_id_counter = base_id

    # Определяем "сдвиг" на основе даты для ротации
    from datetime import datetime
    day_of_year = datetime.strptime(date, "%Y-%m-%d").timetuple().tm_yday
    rotation_offset = day_of_year % len(employees['cashier'])

    # Кассиры - ротация по кругу (по 1 на смену)
    cashier_morning = employees['cashier'][rotation_offset % len(employees['cashier'])]
    cashier_evening = employees['cashier'][(rotation_offset + 1) % len(employees['cashier'])]

    # Менеджеры - ротация
    manager_offset = day_of_year % len(employees['manager'])
    managers = [
        employees['manager'][manager_offset % len(employees['manager'])],
        employees['manager'][(manager_offset + 1) % len(employees['manager'])]
    ]

    # Техники - ротация
    tech_offset = day_of_year % len(employees['technician'])
    technician = employees['technician'][tech_offset % len(employees['technician'])]

    # Кассир: утренняя смена 7:00-15:00
    shift = {
        'id': shift_id_counter,
        'date': date,
        'start_time': "07:00",
        'end_time': "15:00",
        'employee': cashier_morning,
        'role': 'cashier',
        'required': True
    }
    shifts.append(shift)
    shift_id_counter += 1

    # Кассир: вечерняя смена 12:00-20:00
    shift = {
        'id': shift_id_counter,
        'date': date,
        'start_time': "12:00",
        'end_time': "20:00",
        'employee': cashier_evening,
        'role': 'cashier',
        'required': True
    }
    shifts.append(shift)
    shift_id_counter += 1

    # Менеджер 1: 8:00-16:00
    shift = {
        'id': shift_id_counter,
        'date': date,
        'start_time': "08:00",
        'end_time': "16:00",
        'employee': managers[0],
        'role': 'manager',
        'required': True
    }
    shifts.append(shift)
    shift_id_counter += 1

    # Менеджер 2: 12:00-20:00
    shift = {
        'id': shift_id_counter,
        'date': date,
        'start_time': "12:00",
        'end_time': "20:00",
        'employee': managers[1],
        'role': 'manager',
        'required': True
    }
    shifts.append(shift)
    shift_id_counter += 1

    # Техник: 9:00-17:00
    shift = {
        'id': shift_id_counter,
        'date': date,
        'start_time': "09:00",
        'end_time': "17:00",
        'employee': technician,
        'role': 'technician',
        'required': True
    }
    shifts.append(shift)

    return shifts


@app.route('/shifts/generate/<date>', methods=['POST'])
@login_required
@role_required('manager')
def generate_optimal_shifts(date):
    try:
        from datetime import datetime
        target_date = datetime.strptime(date, '%Y-%m-%d').date()
        today = datetime.now().date()

        if target_date < today:
            return jsonify({
                "success": False,
                "error": "Нельзя генерировать смены для прошедших дат"
            }), 400

        # ✅ ПРОВЕРЯЕМ существующие смены на эту дату
        existing_shifts = read_json(SHIFTS_FILE)
        shifts_for_date = [s for s in existing_shifts if s['date'] == date]

        if shifts_for_date:
            return jsonify({
                "success": False,
                "error": f"На {date} уже есть {len(shifts_for_date)} смен. Удалите существующие смены перед генерацией новых."
            }), 400

        # Генерируем оптимальные смены
        optimal_shifts = generate_shifts_for_date(date)

        # ✅ СОХРАНЯЕМ смены в базу (shifts.json)
        existing_shifts.extend(optimal_shifts)
        write_json(SHIFTS_FILE, existing_shifts)

        return jsonify({
            "success": True,
            "shifts": optimal_shifts,
            "message": f"Сгенерировано и сохранено {len(optimal_shifts)} смен для {date}"
        })

    except ValueError:
        return jsonify({"success": False, "error": "Неверный формат даты"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Ошибка генерации: {str(e)}"}), 500


@app.route('/shifts', methods=['OPTIONS'])
@app.route('/shifts/<path:path>', methods=['OPTIONS'])
@app.route('/auth/<path:path>', methods=['OPTIONS'])
def options_response(path=None):
    return '', 200

# ПУТИ К ФАЙЛАМ
SHIFTS_FILE = "/home/kalikrit/myshift/shifts.json"
USERS_FILE = "/home/kalikrit/myshift/users.json"

def read_json(file_path):
    if not os.path.exists(file_path):
        return []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def write_json(file_path, data):
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except:
        return False

# АУТЕНТИФИКАЦИЯ
@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Username and password required"}), 400

    users = read_json(USERS_FILE)
    user = next((u for u in users if u.get('username') == data['username']), None)

    if not user or not verify_password(data['password'], user.get('password', '')):
        return jsonify({"error": "Invalid credentials"}), 401

    token = generate_token(user['id'], user['username'], user['role'])

    return jsonify({
        "token": token,
        "user": {
            "id": user['id'],
            "username": user['username'],
            "role": user['role']
        }
    })


@app.route('/auth/register', methods=['POST'])
@login_required
@role_required('admin')
def register():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Username and password required"}), 400

    users = read_json(USERS_FILE)

    # Проверка существующего пользователя
    if any(u.get('username') == data['username'] for u in users):
        return jsonify({"error": "User already exists"}), 400

    new_id = max([u.get("id", 0) for u in users], default=0) + 1

    new_user = {
        "id": new_id,
        "username": data['username'],
        "password": hash_password(data['password']),
        "role": data.get('role', 'viewer'),
        "store": data.get('store', 'default')
    }

    users.append(new_user)
    write_json(USERS_FILE, users)

    return jsonify({
        "message": "User created successfully",
        "user": {
            "id": new_id,
            "username": new_user['username'],
            "role": new_user['role']
        }
    })


@app.route('/health', methods=['GET'])
def health_check():
    """Простой эндпоинт для проверки здоровья сервиса"""
    try:
        # Проверяем что можем читать файл смен
        read_json(SHIFTS_FILE)
        return jsonify({"status": "healthy"}), 200
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500


@app.route('/auth/me', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({
        "user": {
            "id": request.user['user_id'],
            "username": request.user['username'],
            "role": request.user['role']
        }
    })

# ЗАЩИЩЕННЫЕ ЭНДПОИНТЫ СМЕН
@app.route('/')
def root():
    return jsonify({"message": "My Shift API is running!"})

@app.route('/shifts', methods=['GET'])
@login_required
def get_all_shifts():
    shifts = read_json(SHIFTS_FILE)
    return jsonify(shifts)

@app.route('/shifts/<date>', methods=['GET'])
@login_required
def get_shifts_by_date(date):
    shifts = read_json(SHIFTS_FILE)
    date_shifts = [shift for shift in shifts if shift.get("date") == date]
    return jsonify(date_shifts)

@app.route('/shifts', methods=['POST'])
@login_required
@role_required('manager')  # Только менеджеры и админы могут создавать смены
def create_shift():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    shifts = read_json(SHIFTS_FILE)

    new_id = max([s.get("id", 0) for s in shifts], default=0) + 1

    new_shift = {
        "id": new_id,
        "date": data.get("date"),
        "start_time": data.get("start_time"),
        "end_time": data.get("end_time"),
        "employee": data.get("employee"),
        "role": data.get("role")
    }

    shifts.append(new_shift)
    write_json(SHIFTS_FILE, shifts)

    return jsonify(new_shift), 201

@app.route('/shifts/<int:shift_id>', methods=['PUT'])
@login_required
@role_required('manager')  # Только менеджеры и админы могут редактировать смены
def update_shift(shift_id):
    data = request.get_json()
    shifts = read_json(SHIFTS_FILE)

    for i, shift in enumerate(shifts):
        if shift.get('id') == shift_id:
            for key, value in data.items():
                if value is not None:
                    shifts[i][key] = value
            write_json(SHIFTS_FILE, shifts)
            return jsonify(shifts[i])

    return jsonify({"error": "Shift not found"}), 404

@app.route('/shifts/<int:shift_id>', methods=['DELETE'])
@login_required
@role_required('manager')  # Только менеджеры и админы могут удалять смены
def delete_shift(shift_id):
    shifts = read_json(SHIFTS_FILE)
    initial_length = len(shifts)
    shifts = [s for s in shifts if s.get('id') != shift_id]

    if len(shifts) == initial_length:
        return jsonify({"error": "Shift not found"}), 404

    write_json(SHIFTS_FILE, shifts)
    return jsonify({"message": "Shift deleted"})

if __name__ == '__main__':
    app.run(debug=True)