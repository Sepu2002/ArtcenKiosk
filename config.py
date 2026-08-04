"""Site configuration, loaded from environment variables / a local .env file.

Copy .env.example to .env and adjust per deployment instead of editing code
here — this keeps per-site settings (locker count, serial port, secrets) out
of version control and out of the codebase itself.
"""
import os
import secrets
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent

NUM_LOCKERS = int(os.environ.get('NUM_LOCKERS', 8))

SERIAL_PORT = os.environ.get('SERIAL_PORT', '/dev/ttyUSB0')
BAUD_RATE = int(os.environ.get('BAUD_RATE', 9600))

PICKUP_CODE_LENGTH = int(os.environ.get('PICKUP_CODE_LENGTH', 8))

SESSION_LIFETIME_MINUTES = int(os.environ.get('SESSION_LIFETIME_MINUTES', 30))

PICKUP_RATE_LIMIT_ATTEMPTS = int(os.environ.get('PICKUP_RATE_LIMIT_ATTEMPTS', 5))
PICKUP_RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get('PICKUP_RATE_LIMIT_WINDOW_SECONDS', 60))

DB_PATH = os.environ.get('DB_PATH', str(BASE_DIR / 'kiosk.db'))
LOG_FILE = os.environ.get('LOG_FILE', str(BASE_DIR / 'action_log.log'))

SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    SECRET_KEY = secrets.token_hex(32)
    print(
        "WARNING: SECRET_KEY no está configurada en el entorno; usando una "
        "clave aleatoria temporal (las sesiones de admin no sobrevivirán un "
        "reinicio). Define SECRET_KEY en .env para producción."
    )

ADMIN_PASSWORD_HASH = os.environ.get('ADMIN_PASSWORD_HASH')
if not ADMIN_PASSWORD_HASH:
    from werkzeug.security import generate_password_hash
    ADMIN_PASSWORD_HASH = generate_password_hash('admin123')
    print(
        "WARNING: ADMIN_PASSWORD_HASH no está configurada en el entorno; "
        "usando la contraseña por defecto 'admin123'. Genera una real con "
        "'python set_admin_password.py' y agrégala a .env antes de salir a producción."
    )
