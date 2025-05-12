from flask import Flask, render_template, request, jsonify
import wikipediaapi
import wolframalpha

app = Flask(__name__)
wiki_wiki = wikipediaapi.Wikipedia('Terexi110@gmail.com', 'ru')
WOLFRAM_APP_ID = "TE854P-G9RWHGE7PK"


@app.route('/')
def index():
    return render_template('solar_system.html')

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


@app.route('/get_wolfram_data', methods=['GET'])
def get_wolfram_data():
    planet = request.args.get('planet')
    if not planet:
        return jsonify({"error": "Parameter 'planet' is required"}), 400

    try:
        client = wolframalpha.Client(WOLFRAM_APP_ID)
        res = client.query(f"{planet} planet basic properties")
        return jsonify(parse_wolfram_result(res))
    except Exception as e:
        print(f"API Error: {str(e)}")
        return jsonify({"error": "Failed to process request"}), 500


def parse_wolfram_result(result):
    data = {}
    for pod in result.pods:  # Правильный способ итерации по pods
        try:
            # Обрабатываем все subpods в pod
            subpods = pod.subpods
            if not subpods:
                continue

            # Берем первый subpod (основной)
            main_subpod = subpods[0]
            plaintext = main_subpod.plaintext

            # Обрабатываем физические свойства
            if "physical properties" in pod.title.lower():
                if plaintext:
                    for line in plaintext.split('\n'):
                        if "radius" in line.lower():
                            data["Radius"] = line.split("|")[-1].strip()
                        elif "mass" in line.lower():
                            data["Mass"] = line.split("|")[-1].strip()
                        elif "gravity" in line.lower():
                            data["Gravity"] = line.split("|")[-1].strip()

            # Обрабатываем атмосферу
            elif "atmosphere" in pod.title.lower():
                atmosphere_data = []
                for subpod in subpods:
                    if "major constituents" in subpod.title.lower():
                        for line in subpod.plaintext.split('\n'):
                            if "|" in line:
                                chem, value = line.split("|")
                                atmosphere_data.append(f"{chem.strip()}: {value.strip()}")
                if atmosphere_data:
                    data["Atmosphere"] = ", ".join(atmosphere_data)

            # Обрабатываем расстояние от Солнца
            elif "distance from sun" in pod.title.lower():
                if plaintext:
                    data["Distance from Sun"] = plaintext.split("|")[-1].split()[0].strip()

        except AttributeError as e:
            print(f"Skipping pod due to error: {str(e)}")
            continue
    print(data)
    return data


if __name__ == '__main__':
    app.run(debug=True)
