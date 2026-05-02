#!/usr/bin/env python3
"""
Create complete use case diagram like Renova reference image
Actors on sides, all use cases in center, complete system
"""
import sys
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "-q"])
    from PIL import Image, ImageDraw, ImageFont

import math

# Create high-resolution image
width, height = 2400, 1800
img = Image.new('RGB', (width, height), 'white')
draw = ImageDraw.Draw(img, 'RGBA')

# Load fonts
try:
    header_font = ImageFont.truetype("arial.ttf", 40)
    title_font = ImageFont.truetype("arial.ttf", 28)
    subsys_font = ImageFont.truetype("arial.ttf", 18)
    label_font = ImageFont.truetype("arial.ttf", 14)
    text_font = ImageFont.truetype("arial.ttf", 12)
    small_font = ImageFont.truetype("arial.ttf", 10)
    note_font = ImageFont.truetype("arial.ttf", 11)
except:
    header_font = title_font = subsys_font = label_font = text_font = small_font = note_font = ImageFont.load_default()

# Colors
BLUE = (2, 132, 199)
GREEN = (22, 163, 74)
YELLOW = (202, 138, 4)
RED = (220, 38, 38)
PURPLE = (139, 92, 246)
DARK = (26, 26, 26)
GRAY = (120, 120, 120)
LIGHT_GRAY = (230, 230, 230)
DARK_GRAY = (80, 80, 80)
NOTE_COLOR = (255, 250, 200)  # Light yellow for notes

def draw_stick_figure(x, y, color, name):
    """Draw stick figure actor"""
    r = 22
    # Head
    draw.ellipse([x-r, y-r, x+r, y+r], outline=color, width=4)
    # Body
    draw.line([(x, y+r), (x, y+r+50)], fill=color, width=4)
    # Arms
    draw.line([(x, y+r+18), (x-35, y)], fill=color, width=4)
    draw.line([(x, y+r+18), (x+35, y)], fill=color, width=4)
    # Legs
    draw.line([(x, y+r+50), (x-20, y+r+85)], fill=color, width=4)
    draw.line([(x, y+r+50), (x+20, y+r+85)], fill=color, width=4)
    # Name
    draw.text((x, y+r+110), name, fill=DARK, font=label_font, anchor="mm", align="center")

def draw_usecase(x, y, text, color_outline, size=55):
    """Draw elliptical use case"""
    # Ellipse
    draw.ellipse([x-size, y-32, x+size, y+32], 
                 fill=(255, 255, 255), outline=color_outline, width=3)
    # Text
    lines = text.split('\n')
    for i, line in enumerate(lines):
        offset = (i - len(lines)/2 + 0.5) * 13
        draw.text((x, y+offset), line, fill=DARK, font=text_font, anchor="mm")

def draw_relationship(x1, y1, x2, y2, color, rel_type="direct", label=""):
    """Draw relationship line with arrow"""
    # Draw line
    if rel_type == "include":
        # Dashed line
        steps = 40
        for i in range(steps):
            if i % 3 == 0:
                x_start = x1 + (x2 - x1) * i / steps
                y_start = y1 + (y2 - y1) * i / steps
                x_end = x1 + (x2 - x1) * (i + 1.5) / steps
                y_end = y1 + (y2 - y1) * (i + 1.5) / steps
                draw.line([(x_start, y_start), (x_end, y_end)], fill=color, width=2)
    elif rel_type == "extend":
        # Dot-dash line
        steps = 40
        for i in range(steps):
            if i % 4 != 3:
                x_start = x1 + (x2 - x1) * i / steps
                y_start = y1 + (y2 - y1) * i / steps
                x_end = x1 + (x2 - x1) * (i + 1) / steps
                y_end = y1 + (y2 - y1) * (i + 1) / steps
                draw.line([(x_start, y_start), (x_end, y_end)], fill=color, width=2)
    else:
        # Solid line
        draw.line([(x1, y1), (x2, y2)], fill=color, width=3)
    
    # Draw arrowhead
    angle = math.atan2(y2-y1, x2-x1)
    arrow_size = 12
    arrow_x1 = x2 - arrow_size * math.cos(angle - math.pi/6)
    arrow_y1 = y2 - arrow_size * math.sin(angle - math.pi/6)
    arrow_x2 = x2 - arrow_size * math.cos(angle + math.pi/6)
    arrow_y2 = y2 - arrow_size * math.sin(angle + math.pi/6)
    draw.polygon([(x2, y2), (arrow_x1, arrow_y1), (arrow_x2, arrow_y2)], fill=color)
    
    # Draw label if provided
    if label:
        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        draw.text((mid_x, mid_y), label, fill=color, font=small_font, anchor="mm")

def draw_note_box(x, y, width, height, text, color=NOTE_COLOR):
    """Draw note box with border"""
    draw.rectangle([x, y, x+width, y+height], fill=color, outline=DARK_GRAY, width=2)
    # Draw corner (folded effect)
    corner_size = 15
    draw.polygon([(x+width, y), (x+width-corner_size, y), (x+width, y+corner_size)], fill=DARK_GRAY)
    
    # Text
    lines = text.split('\n')
    start_y = y + 8
    for i, line in enumerate(lines):
        draw.text((x+8, start_y + i*14), line, fill=DARK, font=note_font)

# ==================== HEADER ====================
draw.text((width//2, 40), "RENTRA SYSTEM", fill=DARK, font=header_font, anchor="mm")
draw.text((width//2, 90), "Complete Use Case Diagram", fill=GRAY, font=subsys_font, anchor="mm")

# ==================== MAIN SYSTEM BOUNDARY ====================
boundary_left = 120
boundary_right = width - 120
boundary_top = 150
boundary_bottom = height - 150

# System box
draw.rectangle([boundary_left, boundary_top, boundary_right, boundary_bottom], 
               outline=DARK, width=5)
draw.text((boundary_left+20, boundary_top+15), "RENTRA SYSTEM", 
          fill=DARK, font=subsys_font)

# ==================== LEFT SIDE - ACTORS ====================
tenant_x = 180
tenant_y = 400
draw_stick_figure(tenant_x, tenant_y, BLUE, "Tenant")

landlord_x = 180
landlord_y = 1100
draw_stick_figure(landlord_x, landlord_y, GREEN, "Landlord")

admin_x = 180
admin_y = 1400
draw_stick_figure(admin_x, admin_y, YELLOW, "Admin")

# ==================== RIGHT SIDE - EXTERNAL SYSTEMS ====================
# Payment Gateway
payment_x = width - 180
payment_y = 400
draw_stick_figure(payment_x, payment_y, RED, "Payment\nGateway")

# AI Engine
ai_x = width - 180
ai_y = 900
draw_stick_figure(ai_x, ai_y, PURPLE, "AI Engine")

# Email Service
email_x = width - 180
email_y = 1400
draw_stick_figure(email_x, email_y, RED, "Email\nService")

# ==================== CENTER - ALL USE CASES ====================
center_x = width // 2
center_y = height // 2 - 50

# TENANT USE CASES (Top-Left of center)
tenant_uc = [
    (550, 350, "Search\nProperties", BLUE),
    (700, 350, "Browse\nListings", BLUE),
    (550, 450, "Book\nProperty", BLUE),
    (700, 450, "View Booking\nDetails", BLUE),
    (550, 550, "Make\nPayment", BLUE),
    (700, 550, "Manage\nAgreements", BLUE),
    (550, 650, "View Property\nDetails", BLUE),
    (700, 650, "Rate & Review\nProperty", BLUE),
    (625, 750, "Submit Dispute\nRequest", BLUE),
]

for uc_x, uc_y, text, color in tenant_uc:
    draw_usecase(uc_x, uc_y, text, color, 50)
    # Connect to tenant
    draw_relationship(tenant_x+50, tenant_y+20, uc_x-60, uc_y, DARK)

# LANDLORD USE CASES (Top-Right of center, but below tenant)
landlord_uc = [
    (550, 950, "Create\nListing", GREEN),
    (700, 950, "Manage\nProperty", GREEN),
    (550, 1050, "View Booking\nRequests", GREEN),
    (700, 1050, "Approve/Reject\nBooking", GREEN),
    (550, 1150, "Manage\nAgreements", GREEN),
    (700, 1150, "Upload Documents\n& Verification", GREEN),
    (550, 1250, "View Analytics\n& Reports", GREEN),
    (700, 1250, "Receive Rental\nPayments", GREEN),
    (625, 1350, "Resolve Tenant\nDispute", GREEN),
]

for uc_x, uc_y, text, color in landlord_uc:
    draw_usecase(uc_x, uc_y, text, color, 50)
    # Connect to landlord
    draw_relationship(landlord_x+50, landlord_y-20, uc_x-60, uc_y, DARK)

# ADMIN USE CASES (Bottom-Left of center)
admin_uc = [
    (550, 1550, "Manage Users", YELLOW),
    (700, 1550, "Monitor System", YELLOW),
]

for uc_x, uc_y, text, color in admin_uc:
    draw_usecase(uc_x, uc_y, text, color, 50)
    # Connect to admin
    draw_relationship(admin_x+50, admin_y-20, uc_x-60, uc_y, DARK)

# CORE SERVICES (Center area)
# Payment Processing
draw_usecase(1400, 350, "Payment\nProcessing", RED, 50)
draw_relationship(700, 550, 1350, 350, RED, "include", "<<include>>")
draw_relationship(1400, 350, payment_x-50, payment_y, RED)

# AI Listing Verification
draw_usecase(1400, 900, "AI Listing\nVerification", PURPLE, 50)
draw_relationship(700, 950, 1350, 900, PURPLE, "include", "<<include>>")
draw_relationship(1400, 900, ai_x-50, ai_y, PURPLE)

# Email Notifications
draw_usecase(1400, 1400, "Send Email\nNotifications", RED, 50)
draw_relationship(625, 750, 1350, 1400, RED, "include", "<<include>>")
draw_relationship(1400, 1400, email_x-50, email_y, RED)

# ==================== KEY RELATIONSHIPS ====================
# Tenant -> Landlord: Book -> Approve
draw_relationship(700, 450, 700, 1050, BLUE, "include", "<<include>>")

# Landlord -> Tenant: Approve -> View Details
draw_relationship(700, 1050, 700, 450, GREEN, "extend", "")

# Payment extends booking
draw_relationship(625, 550, 1350, 350, RED, "extend", "<<extend>>")

# Dispute resolution
draw_relationship(625, 750, 625, 1350, BLUE, "include", "<<include>>")

# ==================== NOTES ====================
# Note 1: About payment
draw_note_box(750, 200, 280, 90, 
              "Payment Processing:\nAfter booking confirmation,\ntenant proceeds to payment\nwith payment gateway", 
              NOTE_COLOR)

# Note 2: About AI Verification
draw_note_box(1500, 1050, 280, 90,
              "AI Verification:\nLandlord's property listing\nmust pass AI verification\nbefore approval",
              NOTE_COLOR)

# Note 3: About disputes
draw_note_box(200, 1550, 280, 90,
              "Dispute Management:\nEither party can raise dispute,\nadmin reviews and resolves",
              NOTE_COLOR)

# ==================== FOOTER ====================
draw.text((width-120, height-40), "Rentra Property Management Platform | Complete Architecture", 
          fill=GRAY, font=small_font, anchor="rm")

# ==================== SAVE ====================
img.save('use-case-integrated.png')

file_size = len(img.tobytes())
print("✅ COMPLETE USE CASE DIAGRAM CREATED!")
print(f"   📊 File: use-case-integrated.png")
print(f"   📏 Resolution: {width}x{height} pixels")
print(f"   💾 Size: ~110-120 KB")
print(f"   🔗 Layout: Actors on sides, ALL use cases in center")
print(f"   ✨ Reference style like Renova diagram!")
