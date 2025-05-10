from flask import Flask, render_template, request, jsonify
import wikipediaapi

app = Flask(__name__)
wiki_wiki = wikipediaapi.Wikipedia('Terexi110@gmail.com', 'ru')


@app.route('/')
def index():
    return render_template('index_ss.html')

@app.route('/get_wiki_summary', methods=['GET'])
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
        "Neptune": "Нептун"
    }
    page = wiki_wiki.page(planet_translation.get(planet_name, planet_name))
    
    if not page.exists():
        return jsonify({"error": "Статья не найдена"}), 404

    return jsonify({
        "title": page.title,
        "summary": page.summary[0:500] + "..."  # Первые 500 символов
    })

if __name__ == '__main__':
    app.run(debug=True)
