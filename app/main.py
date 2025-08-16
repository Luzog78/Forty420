import os
import dotenv
import sys
from flask import Flask
from server.routes import main_bp
from server.utils import strbool


app = Flask(__name__, static_folder='client', template_folder='client/html')

app.register_blueprint(main_bp)


if __name__ == '__main__':
	for arg in sys.argv[1:]:
		if arg == '--debug':
			os.environ['DEBUG'] = '1'
			break

		if arg.startswith('--port='):
			port = arg.split('=')[1]
			try:
				port = int(port)
				if port < 1 or port > 65535:
					raise ValueError
				os.environ['PORT'] = str(port)
			except ValueError:
				print("Invalid port number. Please provide a valid port between 1 and 65535.")
				sys.exit(1)

		if os.path.exists(arg):
			dotenv.load_dotenv(arg)
		else:
			print(f"Environment file {arg} does not exist.")
			sys.exit(1)

	app.run(debug=strbool(os.environ.get('DEBUG', False)), host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
