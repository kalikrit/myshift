import pytest
import json
import os
import sys
import tempfile

# Добавляем путь к бэкенду
sys.path.append('/home/kalikrit/myshift')

from simple_app import app

@pytest.fixture
def client():
    """Фикстура для тестового клиента с изолированной БД"""
    # Создаем временный файл для тестов
    db_fd, db_path = tempfile.mkstemp()
    app.config['TESTING'] = True

    # Монkey-patch: заменяем пути к файлам в simple_app
    import simple_app
    original_shifts_file = simple_app.SHIFTS_FILE
    simple_app.SHIFTS_FILE = db_path

    with app.test_client() as client:
        yield client

    # Восстанавливаем оригинальные пути
    simple_app.SHIFTS_FILE = original_shifts_file
    os.close(db_fd)
    os.unlink(db_path)

def test_root_endpoint(client):
    """Тест главной страницы API"""
    response = client.get('/')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'My Shift API is running!'

def test_get_shifts_empty(client):
    """Тест получения пустого списка смен"""
    response = client.get('/shifts')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data == []

def test_create_shift(client):
    """Тест создания смены"""
    shift_data = {
        'date': '2025-11-20',
        'start_time': '09:00',
        'end_time': '17:00',
        'employee': 'кассир1',
        'role': 'cashier'
    }

    response = client.post('/shifts',
                         data=json.dumps(shift_data),
                         content_type='application/json')

    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['date'] == '2025-11-20'
    assert data['employee'] == 'кассир1'
    assert 'id' in data

def test_get_shifts_after_create(client):
    """Тест получения смен после создания"""
    # Сначала создаем смену
    shift_data = {
        'date': '2025-11-20',
        'start_time': '09:00',
        'end_time': '17:00',
        'employee': 'кассир1',
        'role': 'cashier'
    }
    client.post('/shifts',
               data=json.dumps(shift_data),
               content_type='application/json')

    # Теперь получаем
    response = client.get('/shifts')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 1

def test_get_shifts_by_date(client):
    """Тест получения смен по дате"""
    # Сначала создаем смену
    shift_data = {
        'date': '2025-11-21',
        'start_time': '10:00',
        'end_time': '18:00',
        'employee': 'менеджер1',
        'role': 'manager'
    }

    response = client.post('/shifts',
                         data=json.dumps(shift_data),
                         content_type='application/json')
    assert response.status_code == 201

    # Теперь получаем по дате
    response = client.get('/shifts/2025-11-21')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 1
    assert data[0]['date'] == '2025-11-21'
    assert data[0]['role'] == 'manager'

def test_update_shift(client):
    """Тест обновления смены"""
    # Сначала создаем смену
    shift_data = {
        'date': '2025-11-22',
        'start_time': '08:00',
        'end_time': '16:00',
        'employee': 'техник1',
        'role': 'technician'
    }

    response = client.post('/shifts',
                         data=json.dumps(shift_data),
                         content_type='application/json')
    assert response.status_code == 201
    created_shift = json.loads(response.data)
    shift_id = created_shift['id']

    # Обновляем смену
    update_data = {
        'start_time': '09:00',
        'end_time': '17:00'
    }

    response = client.put(f'/shifts/{shift_id}',
                         data=json.dumps(update_data),
                         content_type='application/json')
    assert response.status_code == 200
    updated_shift = json.loads(response.data)
    assert updated_shift['start_time'] == '09:00'
    assert updated_shift['end_time'] == '17:00'

def test_delete_shift(client):
    """Тест удаления смены"""
    # Сначала создаем смену
    shift_data = {
        'date': '2025-11-23',
        'start_time': '07:00',
        'end_time': '15:00',
        'employee': 'кассир2',
        'role': 'cashier'
    }

    response = client.post('/shifts',
                         data=json.dumps(shift_data),
                         content_type='application/json')
    assert response.status_code == 201
    created_shift = json.loads(response.data)
    shift_id = created_shift['id']

    # Удаляем смену
    response = client.delete(f'/shifts/{shift_id}')
    assert response.status_code == 200

    # Проверяем что смена удалена
    response = client.get('/shifts')
    assert response.status_code == 200
    shifts = json.loads(response.data)
    assert not any(s['id'] == shift_id for s in shifts)

