from flask import Flask, render_template
from server.routes import main_bp


app = Flask(__name__, static_folder='client', template_folder='client/html')

app.register_blueprint(main_bp)


if __name__ == '__main__':
	app.run(debug=True, host='0.0.0.0', port=5000)
