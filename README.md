# Flask App

A simple and elegant Flask web application with modern design and interactive features.

## Features

- Clean and responsive design
- Template inheritance with Jinja2
- Modular routing with Flask blueprints
- Static file serving
- Interactive JavaScript functionality
- Modern CSS with gradients and animations

## Project Structure

```
app/
├── main.py              # Main Flask application
├── routes.py            # Route definitions and blueprints
├── templates/           # HTML templates
│   ├── base.html       # Base template
│   ├── index.html      # Home page
│   └── about.html      # About page
└── static/             # Static files
    ├── css/
    │   └── style.css   # Main stylesheet
    └── js/
        └── script.js   # JavaScript functionality
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Forty420
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

1. Make sure you're in the project directory:
```bash
cd app
```

2. Run the Flask application:
```bash
python main.py
```

3. Open your browser and navigate to:
```
http://localhost:5000
```

## Development

- The application runs in debug mode by default
- Static files are automatically served from the `static/` directory
- Templates use Jinja2 syntax and extend from `base.html`
- CSS includes responsive design and modern styling
- JavaScript provides interactive features and animations

## Customization

- Modify `routes.py` to add new routes
- Update templates in the `templates/` directory
- Customize styles in `static/css/style.css`
- Add JavaScript functionality in `static/js/script.js`

## Requirements

- Python 3.7+
- Flask 3.0.0
- Modern web browser with JavaScript enabled

## License

This project is open source and available under the MIT License.
