from flask import Flask, jsonify, request, render_template
import os
import sqlite3
from contextlib import contextmanager

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "sunshine.db")
app = Flask(__name__)


def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with db_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS products (
                p_id INTEGER PRIMARY KEY AUTOINCREMENT,
                p_type TEXT NOT NULL,
                p_name TEXT NOT NULL,
                price INTEGER NOT NULL CHECK(price >= 0),
                p_color TEXT NOT NULL
            )
        """)
        count = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
        if count == 0:
            conn.executemany(
                "INSERT INTO products (p_type, p_name, price, p_color) VALUES (?, ?, ?, ?)",
                [
                    ("Soft Toys", "Classic Teddy Bear", 499, "Honey Brown"),
                    ("Gift Boxes", "Celebration Gift Box", 699, "Blush Pink"),
                    ("Flowers", "Everlasting Rose Bouquet", 899, "Rose Red"),
                    ("Greeting Cards", "A Little Note Card", 149, "Cream")
                ]
            )


@contextmanager
def db_connection():
    conn = get_db_connection()
    try:
        with conn:
            yield conn
    finally:
        conn.close()


def product_dict(row):
    return {"p_id": row["p_id"], "p_type": row["p_type"], "p_name": row["p_name"], "price": row["price"], "p_color": row["p_color"]}


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/products", methods=["GET"])
def get_products():
    search = request.args.get("search", "").strip()
    with db_connection() as conn:
        if search:
            rows = conn.execute(
                "SELECT * FROM products WHERE p_name LIKE ? OR p_type LIKE ? OR p_color LIKE ? ORDER BY p_id DESC",
                (f"%{search}%", f"%{search}%", f"%{search}%")
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM products ORDER BY p_id DESC").fetchall()
    return jsonify([product_dict(row) for row in rows])


@app.route("/products", methods=["POST"])
def add_product():
    data = request.get_json(silent=True) or {}
    required = ["p_type", "p_name", "price", "p_color"]
    missing = [key for key in required if data.get(key) is None or str(data.get(key)).strip() == ""]
    if missing:
        return jsonify({"error": "Required fields: p_type, p_name, price, p_color"}), 400
    try:
        price = int(data["price"])
        if price < 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "price must be a non-negative whole number"}), 400
    with db_connection() as conn:
        cur = conn.execute(
            "INSERT INTO products (p_type, p_name, price, p_color) VALUES (?, ?, ?, ?)",
            (str(data["p_type"]).strip(), str(data["p_name"]).strip(), price, str(data["p_color"]).strip())
        )
        row = conn.execute("SELECT * FROM products WHERE p_id = ?", (cur.lastrowid,)).fetchone()
    return jsonify({"message": "Product added successfully", "product": product_dict(row)}), 201


@app.route("/products/<int:p_id>", methods=["PUT"])
def update_product(p_id):
    data = request.get_json(silent=True) or {}
    required = ["p_type", "p_name", "price", "p_color"]
    if any(data.get(key) is None or str(data.get(key)).strip() == "" for key in required):
        return jsonify({"error": "Required fields: p_type, p_name, price, p_color"}), 400
    try:
        price = int(data["price"])
        if price < 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "price must be a non-negative whole number"}), 400
    with db_connection() as conn:
        cur = conn.execute(
            "UPDATE products SET p_type = ?, p_name = ?, price = ?, p_color = ? WHERE p_id = ?",
            (str(data["p_type"]).strip(), str(data["p_name"]).strip(), price, str(data["p_color"]).strip(), p_id)
        )
        if cur.rowcount == 0:
            return jsonify({"error": "Product not found"}), 404
        row = conn.execute("SELECT * FROM products WHERE p_id = ?", (p_id,)).fetchone()
    return jsonify({"message": "Product updated successfully", "product": product_dict(row)})


@app.route("/products/<int:p_id>", methods=["DELETE"])
def delete_product(p_id):
    with db_connection() as conn:
        cur = conn.execute("DELETE FROM products WHERE p_id = ?", (p_id,))
        if cur.rowcount == 0:
            return jsonify({"error": "Product not found"}), 404
    return jsonify({"message": "Product deleted successfully"})


@app.route("/health")
def health():
    return jsonify({"status": "ok", "application": "Sunshine Gifts Store"})


init_db()

if __name__ == "__main__":
    app.run(debug=True)
