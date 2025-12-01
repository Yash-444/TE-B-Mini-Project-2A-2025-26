from app import create_app

# Entry point for local dev: `python run.py`
app = create_app()

if __name__ == "__main__":
    # Skip socketio for now due to import issues
    print("SocketIO disabled, running regular Flask app")
    app.run(host="0.0.0.0", port=5000, debug=True)
