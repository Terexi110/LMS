from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required
from models import User, db
from forms import RegistrationForm, LoginForm
from flask_bcrypt import Bcrypt
import wikipediaapi


main = Blueprint('main', __name__)
bcrypt = Bcrypt()
wiki_wiki = wikipediaapi.Wikipedia('Terexi110@gmail.com', 'ru')


@main.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        user = User(username=form.username.data, password=hashed_password)
        db.session.add(user)
        db.session.commit()
        flash('Your account has been created!', 'success')
        return redirect(url_for('main.login'))
    return render_template('register.html', form=form)


@main.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and bcrypt.check_password_hash(user.password, form.password.data):
            login_user(user)
            return redirect(url_for('main.index'))
        else:
            flash('Login Unsuccessful. Please check username and password', 'danger')
    return render_template('login.html', form=form)


@main.route('/solar_system')
def solar_system():
    return render_template('solar_system.html')


@main.route('/get_wiki_summary', methods=['GET'])
def get_wiki_summary():
    planet_name = request.args.get('planet')
    planet_translation = {
        "Mercury": "Меркурий",
        "Venus": "Венера",
        "Earth": "Земля",
        "Mars": "Марс",
        "Jupiter": "Юпитер",
        "Saturn": "Сатурн",
        "Uranus": "Уран",
        "Neptune": "Нептун",
        "Saturn Ring": "Кольца Сатурна"
    }
    page = wiki_wiki.page(planet_translation.get(planet_name, planet_name))

    if not page.exists():
        return jsonify({"error": "Статья не найдена"}), 404

    return jsonify({
        "title": page.title,
        "summary": page.summary[0:500] + "..."
    })


@main.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.login'))


@main.route('/')
@login_required
def index():
    return render_template('index.html')
