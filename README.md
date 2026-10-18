# Sunshine Gifts Store

A responsive gift-shop inventory management demo built with Flask, SQLite, HTML, CSS and JavaScript. It is a portfolio project demonstrating REST API CRUD operations and a frontend connected to a persistent database.

## Features
- View all products and search by name, category or colour.
- Add, edit and delete products.
- Product counts, category count and average price summary.
- Responsive layout, light/dark theme, form validation and success/error messages.
- SQLite database and `products` table are created automatically at startup. Four sample products are inserted only when the table is empty.

## Run locally
1. Install Python 3.10 or later.
2. Open a terminal in this folder.
3. (Recommended) create and activate a virtual environment.
   - Windows: `py -m venv .venv` then `.venv\\Scripts\\activate`
4. Install dependencies: `python -m pip install -r requirements.txt`
5. Start the application: `python app.py`
6. Open `http://127.0.0.1:5000` in a browser.

## API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/products` | List products; optional `?search=teddy` |
| POST | `/products` | Add a product |
| PUT | `/products/<p_id>` | Update a product |
| DELETE | `/products/<p_id>` | Delete a product |
| GET | `/health` | Check API status |

### JSON body for POST and PUT
```json
{
  "p_type": "Gift",
  "p_name": "Teddy Bear",
  "price": 500,
  "p_color": "Brown"
}
```

The API follows the table fields from the Sunshine Gifts Store assignment: `p_id`, `p_type`, `p_name`, `price`, `p_color`. The database is stored in this project folder as `sunshine.db` and is created automatically.

## Notes
- Sample inventory is for demonstration only.
- Flask's built-in server is intended for local development. Use a production WSGI server and appropriate hosting configuration before public deployment.
