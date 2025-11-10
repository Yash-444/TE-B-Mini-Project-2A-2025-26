import qrcode
from io import BytesIO
import base64
from PIL import Image

def generate_design_qr(design_id: int, base_url: str = "https://zenspace.ai") -> str:
    """Generate QR code for sharing designs"""
    
    # Create the URL for the design
    design_url = f"{base_url}/design/{design_id}"
    
    # Create QR code instance
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    qr.add_data(design_url)
    qr.make(fit=True)
    
    # Create image
    qr_image = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64 for easy transmission
    buffer = BytesIO()
    qr_image.save(buffer, format='PNG')
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{qr_base64}"

def generate_portfolio_qr(user_id: int, base_url: str = "https://zenspace.ai") -> str:
    """Generate QR code for user's design portfolio"""
    
    portfolio_url = f"{base_url}/portfolio/{user_id}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    qr.add_data(portfolio_url)
    qr.make(fit=True)
    
    qr_image = qr.make_image(fill_color="#7C3AED", back_color="white")
    
    buffer = BytesIO()
    qr_image.save(buffer, format='PNG')
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{qr_base64}"
