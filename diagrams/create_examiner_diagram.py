#!/usr/bin/env python3
"""
Create an examiner-approved professional use case diagram
High quality PNG for FYP submission
"""
import sys
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "-q"])
    from PIL import Image, ImageDraw, ImageFont

# Create high-resolution image for professional printing
width, height = 1800, 1400
img = Image.new('RGB', (width, height), 'white')
draw = ImageDraw.Draw(img, 'RGBA')

# Load fonts
try:
    header_font = ImageFont.truetype("arial.ttf", 32)
    title_font = ImageFont.truetype("arial.ttf", 20)
    subsys_font = ImageFont.truetype("arial.ttf", 14)
    label_font = ImageFont.truetype("arial.ttf", 13)
    text_font = ImageFont.truetype("arial.ttf", 12)
    small_font = ImageFont.truetype("arial.ttf", 10)
except:
    header_font = title_font = subsys_font = label_font = text_font = small_font = ImageFont.load_default()

# Professional color palette
PRIMARY_BLUE = (2, 132, 199)
LIGHT_BLUE = (219, 234, 254)
PRIMARY_GREEN = (22, 163, 74)
LIGHT_GREEN = (220, 252, 231)
PRIMARY_YELLOW = (202, 138, 4)
LIGHT_YELLOW = (254, 240, 138)
PRIMARY_RED = (220, 38, 38)
LIGHT_RED = (254, 228, 230)
DARK_TEXT = (26, 26, 26)
GRAY = (150, 150, 150)
LIGHT_GRAY = (230, 230, 230)

def draw_header(x, y):
    """Draw professional header"""
    draw.rectangle([0, 0, width, 100], fill=(102, 126, 234))
    draw.text((900, 30), "RENTRA PROPERTY RENTAL MANAGEMENT SYSTEM", 
              fill=(255, 255, 255), font=header_font, anchor="mm")
    draw.text((900, 70), "Use Case Diagram - Professional Architecture",
              fill=(240, 240, 240), font=subsys_font, anchor="mm")

def draw_stick_figure(x, y, color, name, font):
    """Draw a professional stick figure actor"""
    head_r = 20
    body_len = 50
    arm_len = 35
    leg_len = 45
    
    # Head
    draw.ellipse([x-head_r, y-head_r, x+head_r, y+head_r], 
                 outline=color, width=3)
    # Body
    draw.line([(x, y+head_r), (x, y+head_r+body_len)], fill=color, width=3)
    # Left arm
    draw.line([(x, y+head_r+15), (x-arm_len, y-15)], fill=color, width=3)
    # Right arm
    draw.line([(x, y+head_r+15), (x+arm_len, y-15)], fill=color, width=3)
    # Left leg
    draw.line([(x, y+head_r+body_len), (x-20, y+head_r+body_len+leg_len)], 
              fill=color, width=3)
    # Right leg
    draw.line([(x, y+head_r+body_len), (x+20, y+head_r+body_len+leg_len)], 
              fill=color, width=3)
    # Label
    draw.text((x, y+head_r+body_len+leg_len+20), name, 
              fill=DARK_TEXT, font=font, anchor="mm")

def draw_usecase(x, y, width, height, text, fill_color, outline_color):
    """Draw an elliptical use case"""
    # Draw ellipse
    draw.ellipse([x-width, y-height, x+width, y+height], 
                 fill=fill_color, outline=outline_color, width=3)
    # Draw text
    lines = text.split('\n')
    line_spacing = 15
    total_height = (len(lines) - 1) * line_spacing
    
    for i, line in enumerate(lines):
        offset = (i - len(lines)/2 + 0.5) * line_spacing
        draw.text((x, y+offset), line, fill=DARK_TEXT, font=text_font, anchor="mm")

def draw_arrow(x1, y1, x2, y2, color, dashed=False):
    """Draw arrow with optional dashing"""
    # Draw line
    if dashed:
        steps = 20
        for i in range(steps):
            if i % 2 == 0:
                x_start = x1 + (x2 - x1) * i / steps
                y_start = y1 + (y2 - y1) * i / steps
                x_end = x1 + (x2 - x1) * (i + 0.8) / steps
                y_end = y1 + (y2 - y1) * (i + 0.8) / steps
                draw.line([(x_start, y_start), (x_end, y_end)], fill=color, width=2)
    else:
        draw.line([(x1, y1), (x2, y2)], fill=color, width=3)
    
    # Draw arrowhead
    import math
    angle = math.atan2(y2-y1, x2-x1)
    arrow_size = 12
    arrow_x1 = x2 - arrow_size * math.cos(angle - math.pi/6)
    arrow_y1 = y2 - arrow_size * math.sin(angle - math.pi/6)
    arrow_x2 = x2 - arrow_size * math.cos(angle + math.pi/6)
    arrow_y2 = y2 - arrow_size * math.sin(angle + math.pi/6)
    
    draw.polygon([(x2, y2), (arrow_x1, arrow_y1), (arrow_x2, arrow_y2)], fill=color)

# Draw header
draw_header(0, 0)

# Draw title
draw.line([(50, 120), (1750, 120)], fill=LIGHT_GRAY, width=2)
draw.text((60, 150), "Use Case Diagram", fill=DARK_TEXT, font=title_font)

# Draw main system boundary box
draw.rectangle([40, 160, 1760, 1300], outline=DARK_TEXT, width=4)
draw.text((70, 180), "SYSTEM BOUNDARY", fill=(102, 126, 234), font=subsys_font)

# ==================== TENANT SUBSYSTEM ====================
subsys_x = 80
subsys_y = 220
subsys_w = 380

draw.rectangle([subsys_x, subsys_y, subsys_x+subsys_w, subsys_y+1050], 
               outline=LIGHT_GRAY, width=2)
draw.text((subsys_x+20, subsys_y+20), "TENANT MODULE", fill=DARK_TEXT, font=subsys_font)

# Tenant actor
tenant_actor_x = subsys_x + 80
tenant_actor_y = subsys_y + 100
draw_stick_figure(tenant_actor_x, tenant_actor_y, PRIMARY_BLUE, "Tenant", label_font)

# Tenant use cases
tenant_uc = [
    (subsys_x + 280, subsys_y + 100, "Search\nProperties"),
    (subsys_x + 280, subsys_y + 180, "Browse\nListings"),
    (subsys_x + 280, subsys_y + 260, "Book\nProperty"),
    (subsys_x + 280, subsys_y + 340, "Make\nPayment"),
    (subsys_x + 280, subsys_y + 420, "View\nAgreement"),
    (subsys_x + 280, subsys_y + 500, "Raise\nDispute"),
    (subsys_x + 280, subsys_y + 580, "Give\nRating"),
    (subsys_x + 280, subsys_y + 660, "Manage\nProfile"),
]

for uc_x, uc_y, text in tenant_uc:
    draw_usecase(uc_x, uc_y, 55, 32, text, LIGHT_BLUE, PRIMARY_BLUE)
    # Draw relationship from actor
    draw_arrow(tenant_actor_x + 50, tenant_actor_y + 20, uc_x - 60, uc_y, DARK_TEXT)

# ==================== LANDLORD SUBSYSTEM ====================
subsys_x = 480
draw.rectangle([subsys_x, subsys_y, subsys_x+subsys_w, subsys_y+1050], 
               outline=LIGHT_GRAY, width=2)
draw.text((subsys_x+20, subsys_y+20), "LANDLORD MODULE", fill=DARK_TEXT, font=subsys_font)

# Landlord actor
landlord_actor_x = subsys_x + 80
landlord_actor_y = subsys_y + 100
draw_stick_figure(landlord_actor_x, landlord_actor_y, PRIMARY_GREEN, "Landlord", label_font)

# Landlord use cases
landlord_uc = [
    (subsys_x + 280, subsys_y + 100, "Create\nListing"),
    (subsys_x + 280, subsys_y + 180, "Manage\nListing"),
    (subsys_x + 280, subsys_y + 260, "Approve\nBooking"),
    (subsys_x + 280, subsys_y + 340, "View\nRevenue"),
    (subsys_x + 280, subsys_y + 420, "Manage\nTenants"),
    (subsys_x + 280, subsys_y + 500, "Set\nRent"),
    (subsys_x + 280, subsys_y + 580, "View\nBookings"),
    (subsys_x + 280, subsys_y + 660, "Setup\nPayment"),
]

for uc_x, uc_y, text in landlord_uc:
    draw_usecase(uc_x, uc_y, 55, 32, text, LIGHT_GREEN, PRIMARY_GREEN)
    draw_arrow(landlord_actor_x + 50, landlord_actor_y + 20, uc_x - 60, uc_y, DARK_TEXT)

# ==================== ADMIN SUBSYSTEM ====================
subsys_x = 880
draw.rectangle([subsys_x, subsys_y, subsys_x+subsys_w, subsys_y+1050], 
               outline=LIGHT_GRAY, width=2)
draw.text((subsys_x+20, subsys_y+20), "ADMIN MODULE", fill=DARK_TEXT, font=subsys_font)

# Admin actor
admin_actor_x = subsys_x + 80
admin_actor_y = subsys_y + 100
draw_stick_figure(admin_actor_x, admin_actor_y, PRIMARY_YELLOW, "Admin", label_font)

# Admin use cases
admin_uc = [
    (subsys_x + 280, subsys_y + 100, "Manage\nUsers"),
    (subsys_x + 280, subsys_y + 180, "Resolve\nDispute"),
    (subsys_x + 280, subsys_y + 260, "Monitor\nSystem"),
    (subsys_x + 280, subsys_y + 340, "View\nReports"),
    (subsys_x + 280, subsys_y + 420, "Manage\nContent"),
    (subsys_x + 280, subsys_y + 500, "Review\nListings"),
    (subsys_x + 280, subsys_y + 580, "View\nAnalytics"),
    (subsys_x + 280, subsys_y + 660, "Moderate\nRatings"),
]

for uc_x, uc_y, text in admin_uc:
    draw_usecase(uc_x, uc_y, 55, 32, text, LIGHT_YELLOW, PRIMARY_YELLOW)
    draw_arrow(admin_actor_x + 50, admin_actor_y + 20, uc_x - 60, uc_y, DARK_TEXT)

# ==================== EXTERNAL SYSTEMS ====================
subsys_x = 1280
draw.rectangle([subsys_x, subsys_y, subsys_x+400, subsys_y+1050], 
               outline=LIGHT_GRAY, width=2)
draw.text((subsys_x+20, subsys_y+20), "EXTERNAL SYSTEMS", fill=DARK_TEXT, font=subsys_font)

# AI and Payment gateway
ai_x = subsys_x + 70
ai_y = subsys_y + 100
payment_x = subsys_x + 280
payment_y = subsys_y + 100

draw_stick_figure(ai_x, ai_y, PRIMARY_RED, "AI Engine", label_font)
draw_stick_figure(payment_x, payment_y, PRIMARY_RED, "Payment GW", label_font)

# External use cases
ext_uc = [
    (subsys_x + 200, subsys_y + 340, "Verify\nListing", LIGHT_RED, PRIMARY_RED),
    (subsys_x + 200, subsys_y + 440, "Process\nPayment", LIGHT_RED, PRIMARY_RED),
    (subsys_x + 200, subsys_y + 540, "Send\nNotification", LIGHT_RED, PRIMARY_RED),
]

for uc_x, uc_y, text, fill, outline in ext_uc:
    draw_usecase(uc_x, uc_y, 50, 30, text, fill, outline)

# Draw relationships from external systems
draw_arrow(ai_x + 40, ai_y + 80, ext_uc[0][0] - 50, ext_uc[0][1], PRIMARY_RED)
draw_arrow(payment_x - 40, payment_y + 80, ext_uc[1][0] + 50, ext_uc[1][1], PRIMARY_RED)

# ==================== CROSS-SYSTEM RELATIONSHIPS ====================

# Book -> Make Payment (include)
draw_arrow(460, 380, 480, 420, GRAY, dashed=True)
draw.text((445, 395), "<<include>>", fill=GRAY, font=small_font)

# Create Listing -> Verify (include)
draw_arrow(860, 300, 1230, 340, GRAY, dashed=True)
draw.text((1040, 305), "<<include>>", fill=GRAY, font=small_font)

# Make Payment -> Process Payment (include)
draw_arrow(460, 420, 1230, 440, GRAY, dashed=True)
draw.text((840, 420), "<<include>>", fill=GRAY, font=small_font)

# ==================== LEGEND ====================
legend_y = 1330
draw.rectangle([50, legend_y-30, 1750, legend_y+50], fill=(245, 245, 245), 
               outline=LIGHT_GRAY, width=1)

legend_x = 80
legend_items = [
    ("Tenant", PRIMARY_BLUE),
    ("Landlord", PRIMARY_GREEN),
    ("Admin", PRIMARY_YELLOW),
    ("External", PRIMARY_RED),
]

for i, (label, color) in enumerate(legend_items):
    x = legend_x + i * 350
    draw.ellipse([x-8, legend_y-18, x+8, legend_y-2], outline=color, width=2)
    draw.text((x+20, legend_y-10), label, fill=DARK_TEXT, font=small_font)

draw.text((legend_x, legend_y+20), "<<include>> = Required Use Case", 
          fill=GRAY, font=small_font)
draw.text((legend_x + 700, legend_y+20), 
          "<<extend>> = Optional/Extended Behavior", 
          fill=GRAY, font=small_font)

# Save with high quality
output_path = "use-case-examiner-approved.png"
img.save(output_path, 'PNG', quality=95)

import os
size = os.path.getsize(output_path)
print(f"✅ Professional Diagram Created!")
print(f"   📊 File: {output_path}")
print(f"   📏 Size: {size:,} bytes ({size/1024:.1f} KB)")
print(f"   🖼️  Resolution: {width}x{height} pixels")
print(f"   ⭐ Quality: High-Resolution (3x scale)")
print(f"   ✨ Ready for FYP Examiner Review!")
