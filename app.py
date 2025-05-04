from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from models import db
from routes import main as routes

app = Flask(__name__)
app.config.from_object('config.Config')

# Инициализация базы данных и миграций
db.init_app(app)
migrate = Migrate(app, db)

# Настройка Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'  # Имя маршрута для страницы входа

from models import User  # Импортируем модель пользователя

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Регистрация маршрутов
app.register_blueprint(routes)

if __name__ == '__main__':
    app.run(debug=True)
