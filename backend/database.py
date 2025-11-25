import json
import os
from typing import List, Dict, Any

# Пути к файлам данных
SHIFTS_FILE = "shifts.json"
USERS_FILE = "users.json"

def read_json(file_path: str) -> List[Dict[str, Any]]:
    """Чтение данных из JSON файла"""
    if not os.path.exists(file_path):
        return []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def write_json(file_path: str, data: List[Dict[str, Any]]) -> bool:
    """Запись данных в JSON файл"""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception:
        return False

# Функции для работы со сменами
def get_shifts() -> List[Dict[str, Any]]:
    return read_json(SHIFTS_FILE)

def save_shifts(shifts: List[Dict[str, Any]]) -> bool:
    return write_json(SHIFTS_FILE, shifts)

# Функции для работы с пользователями
def get_users() -> List[Dict[str, Any]]:
    return read_json(USERS_FILE)

def save_users(users: List[Dict[str, Any]]) -> bool:
    return write_json(USERS_FILE, users)