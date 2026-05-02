#!/usr/bin/env python3
"""
Create a professional use case diagram PNG for FYP submission
"""
import sys
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "-q"])
    from PIL import Image, ImageDraw, ImageFont

# Create a high-resolution image
width, height = 1400, 1050
img = Image.new('RGB', (width, height), 'white')
draw = ImageDraw.Draw(img, 'RGBA')

# Try to load fonts
try:
    title_font = ImageFont.truetype("arial.ttf", 24)
    subtitle_font = ImageFont.truetype("arial.ttf", 16)
    label_font = ImageFont.truetype("arial.ttf", 12)
    text_font = ImageFont.truetype("arial.ttf", 11)
    small_font = ImageFont.truetype("arial.ttf", 9)
except:
    title_font = label_font = text_font = small_font = ImageFont.load_default()

# Colors
BLACK = (26, 26, 26)
DARK_GRAY = (80, 80, 80)
GRAY = (150, 150, 150)
LIGHT_GRAY = (230, 230, 230)
BLUE = (37, 99, 235)
LIGHT_BLUE = (219, 234, 254)
GREEN = (5, 150, 105)
LIGHT_GREEN = (220, 252, 231)
RED = (220, 38, 38)
LIGHT_RED = (254, 228, 230)
PURPLE = (102, 126, 234)

def draw_actor(x, y, color, name):
    """Draw a stick figure actor"""
    head_radius = 15
    # Head
    draw.ellipse([x-head_radius, y-head_radius, x+head_radius, y+head_radius], 
                 outline=color, width=2)
    # Body
    draw.line([(x, y+head_radius), (x, y+head_radius+40)], fill=color, width=2)
    # Arms
    draw.line([(x, y+head_radius+15), (x-30, y)], fill=color, width=2)
    draw.line([(x, y+head_radius+15), (x+30, y)], fill=color, width=2)
    # Legs
    draw.line([(x, y+head_radius+40), (x-20, y+head_radius+70)], fill=color, width=2)
    draw.line([(x, y+head_radius+40), (x+20, y+head_radius+70)], fill=color, width=2)
    # Label
    draw.text((x-25, y+100), name, fill=BLACK, font=label_font)

def draw_usecase(x, y, width, height, text, fill_color, outline_color):
    """Draw an elliptical use case"""
    # Ellipse
    draw.ellipse([x-width, y-height, x+width, y+height], 
                 fill=fill_color, outline=outline_color, width=2)
    # Text
    lines = text.split('\n')
    if len(lines) == 1:
        draw.text((x-35, y-7), text, fill=BLACK, font=text_font)
    else:
        for i, line in enumerate(lines):
            offset = (i - len(lines)/2 + 0.5) * 12
            draw.text((x-25, y-7+offset), line, fill=BLACK, font=text_font)

def draw_arrow(x1, y1, x2, y2, dashed=False, color=DARK_GRAY):
    """Draw an arrow with optional dashing"""
    if dashed:
        # Draw dashed line
        dist = ((x2-x1)**2 + (y2-y1)**2)**0.5
        steps = int(dist / 6)
        for i in range(0, steps, 2):
            x_start = x1 + (x2-x1) * i / steps
            y_start = y1 + (y2-y1) * i / steps
            x_end = x1 + (x2-x1) * min(i+1, steps) / steps
            y_end = y1 + (y2-y1) * min(i+1, steps) / steps
            draw.line([(x_start, y_start), (x_end, y_end)], fill=color, width=1)
    else:
        draw.line([(x1, y1), (x2, y2)], fill=color, width=2)
    
    # Arrowhead
    import math
    angle = math.atan2(y2-y1, x2-x1)
    arrow_size = 8
    arrow_x1 = x2 - arrow_size * math.cos(angle - math.pi/6)
    arrow_y1 = y2 - arrow_size * math.sin(angle - math.pi/6)
    arrow_x2 = x2 - arrow_size * math.cos(angle + math.pi/6)
    arrow_y2 = y2 - arrow_size * math.sin(angle + math.pi/6)
    
    draw.polygon([(x2, y2), (arrow_x1, arrow_y1), (arrow_x2, arrow_y2)], 
                 fill=color)

# ============ HEADER ============
draw.text((700//2, 30), "Rentra Property Rental System", fill=BLACK, font=title_font)
draw.text((700//2 - 50, 60), "Use Case Diagram - Professional Architecture", 
          fill=DARK_GRAY, font=subtitle_font)
draw.line([(100, 80), (1300, 80)], fill=LIGHT_GRAY, width=2)

# ============ MAIN SYSTEM BOX ============
draw.rectangle([80, 100, 1320, 950], outline=BLACK, width=3)
draw.text((100, 110), "System Boundary", fill=DARK_GRAY, font=label_font)

# ============ SUBSYSTEM 1: TENANT MANAGEMENT (LEFT) ============
draw.rectangle([100, 130, 380, 930], outline=LIGHT_GRAY, width=2)
draw.text((120, 145), "Tenant Management", fill=DARK_GRAY, font=label_font)

# Tenant Actor
draw_actor(180, 200, BLUE, "Tenant")

# Tenant Use Cases
usecase_data = [
    (300, 180, "Search\nProperties"),
    (300, 260, "Book\nProperty"),
    (300, 340, "Make\nPayment"),
    (300, 420, "Raise\nDispute"),
    (300, 500, "View\nRatings"),
    (300, 580, "Register\n/Login"),
]

for x, y, text in usecase_data:
    draw_usecase(x, y, 45, 25, text, LIGHT_BLUE, BLUE)

# Tenant relationships
for x, y, _ in usecase_data[:-1]:
    draw_arrow(220, 220, x-50, y, color=BLACK)

# Include relationship
draw_arrow(220, 250, 255, 580, dashed=True, color=GRAY)

# ============ SUBSYSTEM 2: CORE SERVICES (MIDDLE) ============
draw.rectangle([400, 130, 750, 930], outline=LIGHT_GRAY, width=2)
draw.text((420, 145), "Core Services", fill=DARK_GRAY, font=label_font)

core_uc = [
    (550, 180, "Generate\nDigital\nAgreement", LIGHT_RED, RED),
    (650, 260, "Approve\nBooking", LIGHT_GREEN, GREEN),
    (550, 340, "Add\nListing", LIGHT_GREEN, GREEN),
    (650, 420, "Resolve\nDispute", LIGHT_RED, RED),
    (550, 500, "View\nAnalytics", LIGHT_BLUE, BLUE),
    (650, 580, "Send\nNotification", LIGHT_BLUE, BLUE),
]

for x, y, text, fill, outline in core_uc:
    draw_usecase(x, y, 45, 28, text, fill, outline)

# ============ SUBSYSTEM 3: EXTERNAL SYSTEMS (RIGHT) ============
draw.rectangle([760, 130, 1320, 930], outline=LIGHT_GRAY, width=2)
draw.text((780, 145), "External Systems", fill=DARK_GRAY, font=label_font)

# AI System Actor
draw_actor(850, 200, RED, "AI System")

# Payment Gateway Actor
draw_actor(1050, 200, RED, "Payment\nGateway")

# External Use Cases
ext_uc = [
    (950, 360, "Verify\nListing", LIGHT_RED, RED),
    (1080, 360, "Process\nPayment", LIGHT_RED, RED),
    (950, 480, "Send\nSMS/Email", LIGHT_RED, RED),
]

for x, y, text, fill, outline in ext_uc:
    draw_usecase(x, y, 45, 28, text, fill, outline)

# ============ CROSS-SUBSYSTEM RELATIONSHIPS ============

# Tenant to Book -> Generate Agreement (include)
draw_arrow(355, 260, 505, 180, dashed=True, color=GRAY)
draw.text((410, 210), "<<include>>", fill=GRAY, font=small_font)

# Book to AI Verify (include)
draw_arrow(355, 260, 905, 335, dashed=True, color=GRAY)
draw.text((600, 275), "<<include>>", fill=GRAY, font=small_font)

# Payment to Process Payment (include)
draw_arrow(355, 340, 1035, 335, dashed=True, color=GRAY)
draw.text((650, 350), "<<include>>", fill=GRAY, font=small_font)

# Add Listing to Verify
draw_arrow(595, 370, 905, 470, dashed=True, color=GRAY)
draw.text((720, 400), "<<include>>", fill=GRAY, font=small_font)

# ============ LEGEND ============
legend_y = 870
draw.rectangle([100, legend_y, 1320, legend_y+60], fill=(240, 240, 240), 
               outline=LIGHT_GRAY, width=1)

legend_items = [
    (150, "Primary Actor", BLUE),
    (400, "Secondary Actor", GREEN),
    (650, "External System", RED),
    (900, "Direct Use", BLACK),
    (1100, "<<include>>", GRAY),
]

circle_radius = 6
for x, label, color in legend_items:
    if label in ["Direct Use", "<<include>>"]:
        if label == "Direct Use":
            draw.line([(x-20, legend_y+25), (x+10, legend_y+25)], fill=color, width=2)
        else:
            draw.line([(x-20, legend_y+25), (x+10, legend_y+25)], fill=color, width=1)
            # Add dashes
            draw.line([(x-15, legend_y+25), (x-5, legend_y+25)], fill=color, width=1)
    else:
        draw.ellipse([x-circle_radius, legend_y+20-circle_radius, 
                      x+circle_radius, legend_y+25+circle_radius], 
                     outline=color, width=2)
    draw.text((x+20, legend_y+18), label, fill=BLACK, font=small_font)

# Save the image
output_path = "use-case-professional.png"
img.save(output_path, 'PNG', quality=95)
print(f"✅ Created {output_path}")

import os
size = os.path.getsize(output_path)
print(f"✅ File size: {size:,} bytes ({size/1024:.1f} KB)")
print(f"✅ Resolution: {width}x{height} pixels")
print(f"✅ Perfect for FYP submission!")
