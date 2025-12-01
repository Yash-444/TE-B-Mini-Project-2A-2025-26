from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, UserMixin
from passlib.hash import pbkdf2_sha256
from .db import get_db

auth_bp = Blueprint("auth", __name__, template_folder="../templates")

class User(UserMixin):
    def __init__(self, id, email, role, full_name):
        self.id = str(id)
        self.email = email
        self.role = role
        self.full_name = full_name

def user_loader(user_id):
    db = get_db()
    row = db.execute("SELECT id, email, role, full_name FROM users WHERE id=?", (user_id,)).fetchone()
    if row:
        return User(row["id"], row["email"], row["role"], row["full_name"])
    return None

@auth_bp.route("/login", methods=["GET","POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email","").strip().lower()
        pw = request.form.get("password","")
        db = get_db()
        row = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if row and pbkdf2_sha256.verify(pw, row["password_hash"]):
            login_user(User(row["id"], row["email"], row["role"], row["full_name"]))
            return redirect(url_for("main.home"))
        flash("Invalid credentials", "error")
    return render_template("auth_login.html")

@auth_bp.route("/register", methods=["GET","POST"])
def register():
    if request.method == "POST":
        email = request.form.get("email","").strip().lower()
        full_name = request.form.get("full_name","").strip()
        pw = request.form.get("password","")
        role = request.form.get("role","student")
        if role not in ("student","teacher"):
            role = "student"
        db = get_db()
        try:
            db.execute("INSERT INTO users(email,password_hash,role,full_name) VALUES(?,?,?,?)",
                       (email, pbkdf2_sha256.hash(pw), role, full_name))
            db.commit()
            flash("Registered! Please login.", "success")
            return redirect(url_for("auth.login"))
        except Exception as e:
            db.rollback()
            flash(f"Registration failed: {e}", "error")
    return render_template("auth_register.html")

@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("auth.login"))
