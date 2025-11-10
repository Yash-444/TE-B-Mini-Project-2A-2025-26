from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
import qrcode
import json
from datetime import datetime
from werkzeug.utils import secure_filename
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "static/uploads"
CORS(app)

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('static/generated', exist_ok=True)
os.makedirs('static/pdfs', exist_ok=True)
os.makedirs('static/qrcodes', exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/")
def index():
    return jsonify({"success": True, "message": "ZenSpace.AI Backend Running"})

@app.route('/api/upload-and-analyze', methods=['POST'])
def upload_and_analyze():
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file provided'}), 400
        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({'success': False, 'message': 'Invalid file format'}), 400
        filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        user_prompt = request.form.get('prompt', '')
        user_style = request.form.get('style', '')
        room_name = request.form.get('room_name', 'My Room')
        design_id = uuid.uuid4().hex[:12]
        room_analysis = {
            'room_type': 'Living Room',
            'size': 'Approx. 200 sq ft',
            'style': user_style or 'Modern',
            'lighting': 'Natural',
            'detected_objects': [
                {'id': 1, 'name': 'Sofa', 'position': {'x': 100, 'y': 150}, 'confidence': 0.95, 'price': 899.99},
                {'id': 2, 'name': 'Coffee Table', 'position': {'x': 120, 'y': 180}, 'confidence': 0.87, 'price': 299.99},
                {'id': 3, 'name': 'TV Stand', 'position': {'x': 50, 'y': 100}, 'confidence': 0.92, 'price': 199.99},
                {'id': 4, 'name': 'Floor Lamp', 'position': {'x': 200, 'y': 120}, 'confidence': 0.88, 'price': 149.99}
            ],
            'suggestions': [
                'Add accent pillows for color',
                'Consider a floor lamp for ambient lighting',
                'Wall art would enhance the space'
            ]
        }
        return jsonify({
            'success': True,
            'design_id': design_id,
            'file_path': f'/static/uploads/{filename}',
            'room_analysis': room_analysis,
            'ai_analysis': {'processed': True, 'prompt': user_prompt, 'style': user_style}
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route("/api/upload", methods=["POST"])
def simple_upload():
    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file provided"}), 400
    file = request.files["file"]
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"success": False, "message": "Invalid file format"}), 400
    filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}")
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(file_path)
    return jsonify({"success": True, "file_path": f"/static/uploads/{filename}", "design_id": uuid.uuid4().hex[:8]})

@app.route('/api/designs', methods=['GET'])
def get_designs():
    return jsonify({"success": True, "designs": []})

@app.route('/api/furniture', methods=['GET'])
def get_furniture():
    furniture = [
        {'id': 1, 'name': 'Modern Sofa', 'category': 'seating', 'price': 899.99, 'image': '/static/furniture/sofa.jpg'},
        {'id': 2, 'name': 'Coffee Table', 'category': 'tables', 'price': 299.99, 'image': '/static/furniture/table.jpg'},
        {'id': 3, 'name': 'Floor Lamp', 'category': 'lighting', 'price': 149.99, 'image': '/static/furniture/lamp.jpg'},
        {'id': 4, 'name': 'TV Stand', 'category': 'storage', 'price': 199.99, 'image': '/static/furniture/tv_stand.jpg'},
        {'id': 5, 'name': 'Accent Chair', 'category': 'seating', 'price': 549.99, 'image': '/static/furniture/chair.jpg'},
        {'id': 6, 'name': 'Side Table', 'category': 'tables', 'price': 129.99, 'image': '/static/furniture/side_table.jpg'}
    ]
    return jsonify({'success': True, 'furniture': furniture})

@app.route('/api/calculate-pricing', methods=['POST'])
def calculate_pricing():
    try:
        data = request.get_json()
        selected_items = data.get('selected_items', [])
        total = sum(item.get('price', 0) * item.get('quantity', 1) for item in selected_items)
        tax = total * 0.08
        shipping = 50.0 if total > 0 else 0
        final_total = total + tax + shipping
        pricing_data = {
            'items': selected_items,
            'subtotal': total,
            'tax': tax,
            'shipping': shipping,
            'total': final_total,
            'estimated_delivery': '2-3 weeks'
        }
        return jsonify({'success': True, 'pricing': pricing_data})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/generate-final-report', methods=['POST'])
def generate_final_report():
    try:
        data = request.get_json()
        design_id = data.get('design_id')
        pricing_data = data.get('pricing_data')
        design_data = data.get('design_data', {})
        qr_data = {
            'design_id': design_id,
            'total_cost': pricing_data.get('total', 0),
            'items': len(pricing_data.get('items', [])),
            'generated_at': datetime.now().isoformat()
        }
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
        qr.add_data(json.dumps(qr_data))
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_filename = f"qr_{design_id}.png"
        qr_path = os.path.join('static/qrcodes', qr_filename)
        qr_img.save(qr_path)
        pdf_filename = f"design_{design_id}.pdf"
        pdf_path = os.path.join('static/pdfs', pdf_filename)
        doc = SimpleDocTemplate(pdf_path, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        story.append(Paragraph("ZenSpace.AI Design Report", styles['Title']))
        story.append(Spacer(1, 20))
        story.append(Paragraph(f"Design ID: {design_id}", styles['Normal']))
        story.append(Paragraph(f"Total Cost: ${pricing_data.get('total', 0):.2f}", styles['Normal']))
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", styles['Normal']))
        story.append(Spacer(1, 20))
        if os.path.exists(qr_path):
            qr_image = Image(qr_path, width=2*inch, height=2*inch)
            story.append(qr_image)
        doc.build(story)
        return jsonify({
            'success': True,
            'pdf_url': f'/static/pdfs/{pdf_filename}',
            'qr_code_url': f'/static/qrcodes/{qr_filename}'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/static/pdfs/<filename>')
def pdf_file(filename):
    return send_from_directory('static/pdfs', filename)

@app.route('/static/qrcodes/<filename>')
def qr_code_file(filename):
    return send_from_directory('static/qrcodes', filename)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
