#!/usr/bin/env python3
"""
Professional UML Use Case Diagram - NO COLORS VERSION
Actors on sides (like reference image), all use cases in center
Complete data flow labels on relationships
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
width, height = 3200, 2200
img = Image.new('RGB', (width, height), 'white')
draw = ImageDraw.Draw(img, 'RGBA')

# Load fonts
try:
    header_font = ImageFont.truetype("arial.ttf", 48)
    subsys_font = ImageFont.truetype("arial.ttf", 20)
    label_font = ImageFont.truetype("arial.ttf", 15)
    text_font = ImageFont.truetype("arial.ttf", 12)
    small_font = ImageFont.truetype("arial.ttf", 10)
    tiny_font = ImageFont.truetype("arial.ttf", 9)
except:
    header_font = subsys_font = label_font = text_font = small_font = tiny_font = ImageFont.load_default()

# Colors - only grayscale
BLACK = (0, 0, 0)
DARK_GRAY = (50, 50, 50)
GRAY = (100, 100, 100)
LIGHT_GRAY = (200, 200, 200)
WHITE = (255, 255, 255)

def draw_actor_box(x, y, lines):
    """Draw actor box (simple rectangle)"""
    width_box = 100
    height_box = 80
    
    draw.rectangle([x-width_box//2, y-height_box//2, x+width_box//2, y+height_box//2],
                   outline=BLACK, fill=WHITE, width=3)
    
    # Draw text
    for i, line in enumerate(lines):
        offset = (i - len(lines)/2 + 0.5) * 18
        draw.text((x, y+offset), line, fill=BLACK, font=label_font, anchor="mm", align="center")

def draw_usecase_box(x, y, title, description=""):
    """Draw use case box with description inside"""
    width_box = 140
    height_box = 110
    
    draw.rectangle([x-width_box//2, y-height_box//2, x+width_box//2, y+height_box//2],
                   outline=BLACK, fill=WHITE, width=2)
    
    # Title
    draw.text((x, y-35), title, fill=BLACK, font=label_font, anchor="mm", align="center")
    
    # Description
    if description:
        desc_lines = description.split('\n')
        for i, line in enumerate(desc_lines):
            offset = (i - len(desc_lines)/2 + 0.5) * 12
            draw.text((x, y+8+offset), line, fill=DARK_GRAY, font=tiny_font, anchor="mm")

def draw_datastore(x, y, name_lines):
    """Draw data store (two parallel lines with name between)"""
    width_ds = 150
    height_ds = 25
    
    # Top line
    draw.line([(x-width_ds//2, y-height_ds), (x+width_ds//2, y-height_ds)], fill=BLACK, width=3)
    # Bottom line
    draw.line([(x-width_ds//2, y+height_ds), (x+width_ds//2, y+height_ds)], fill=BLACK, width=3)
    # Left connection
    draw.line([(x-width_ds//2, y-height_ds), (x-width_ds//2-8, y-height_ds-8)], fill=BLACK, width=2)
    # Right connection
    draw.line([(x+width_ds//2, y-height_ds), (x+width_ds//2-8, y-height_ds-8)], fill=BLACK, width=2)
    
    # Name inside
    for i, line in enumerate(name_lines):
        offset = (i - len(name_lines)/2 + 0.5) * 12
        draw.text((x, y+offset), line, fill=BLACK, font=small_font, anchor="mm")

def draw_relationship(x1, y1, x2, y2, label="", label_offset=(0, 0)):
    """Draw relationship line with label"""
    
    # Draw line
    draw.line([(x1, y1), (x2, y2)], fill=BLACK, width=2)
    
    # Draw arrowhead
    angle = math.atan2(y2-y1, x2-x1)
    arrow_size = 12
    arrow_x1 = x2 - arrow_size * math.cos(angle - math.pi/6)
    arrow_y1 = y2 - arrow_size * math.sin(angle - math.pi/6)
    arrow_x2 = x2 - arrow_size * math.cos(angle + math.pi/6)
    arrow_y2 = y2 - arrow_size * math.sin(angle + math.pi/6)
    draw.polygon([(x2, y2), (arrow_x1, arrow_y1), (arrow_x2, arrow_y2)], fill=BLACK)
    
    # Draw label if provided
    if label:
        mid_x = (x1 + x2) / 2 + label_offset[0]
        mid_y = (y1 + y2) / 2 + label_offset[1]
        
        # Background for label
        label_lines = label.split('\n')
        label_height = len(label_lines) * 12
        label_width = 80
        
        draw.rectangle([mid_x-label_width//2, mid_y-label_height//2-5, 
                        mid_x+label_width//2, mid_y+label_height//2+5],
                       fill=WHITE, outline=LIGHT_GRAY, width=1)
        
        # Draw text
        for i, line in enumerate(label_lines):
            offset = (i - len(label_lines)/2 + 0.5) * 12
            draw.text((mid_x, mid_y+offset), line, fill=DARK_GRAY, font=tiny_font, anchor="mm")

# ==================== HEADER ====================
draw.text((width//2, 50), "RENTRA SYSTEM", fill=BLACK, font=header_font, anchor="mm")
draw.text((width//2, 110), "Complete Use Case Diagram with Data Flow", fill=GRAY, font=subsys_font, anchor="mm")

# ==================== SYSTEM BOUNDARY ====================
boundary_left = 150
boundary_right = width - 150
boundary_top = 180
boundary_bottom = height - 150

draw.rectangle([boundary_left, boundary_top, boundary_right, boundary_bottom], 
               outline=BLACK, fill=WHITE, width=4)
draw.text((boundary_left+20, boundary_top+15), "RENTRA SYSTEM BOUNDARY", 
          fill=BLACK, font=subsys_font)

# ==================== ACTORS ====================
# Tenant User (TOP RIGHT)
tenant_x = width - 280
tenant_y = 400
draw_actor_box(tenant_x, tenant_y, ["Tenant", "User"])

# Landlord User (BOTTOM LEFT)
landlord_x = 280
landlord_y = height - 400
draw_actor_box(landlord_x, landlord_y, ["Landlord", "User"])

# Admin User (BOTTOM RIGHT)
admin_x = width - 280
admin_y = height - 400
draw_actor_box(admin_x, admin_y, ["Admin", "User"])

# ==================== EXTERNAL SYSTEMS ====================
# Notification Service (RIGHT MIDDLE)
notif_x = width - 280
notif_y = 1100
draw_actor_box(notif_x, notif_y, ["Notification", "Service", "Email/SMS"])

# ==================== CENTER - USE CASES ====================
center_x = width // 2
center_y = height // 2 - 100

# DATA STORE (CENTER)
draw_datastore(center_x, center_y, ["Agreements", "Payments", "Disputes", "Data Store"])

# ---- USE CASE 1: Create Agreement ----
uc1_x, uc1_y = 500, 450
draw_usecase_box(uc1_x, uc1_y, "1. Create\nAgreement", "Form submission\nValidation")
draw_relationship(uc1_x+80, uc1_y, center_x-80, center_y-50, "Listing ID\nApply", (-60, -30))
draw_relationship(landlord_x+60, landlord_y-100, uc1_x-80, uc1_y+30, "Review\nrequest", (-80, 0))

# ---- USE CASE 2: Landlord Review Decision ----
uc2_x, uc2_y = 500, 900
draw_usecase_box(uc2_x, uc2_y, "2. Landlord\nReview\nDecision", "Approve/Reject")
draw_relationship(uc1_x, uc1_y+65, uc2_x, uc2_y-55, "Agreement\ndata", (-60, 0))
draw_relationship(uc2_x+80, uc2_y, center_x-80, center_y+30, "Decision", (-60, 30))
draw_relationship(landlord_x+60, landlord_y-50, uc2_x-80, uc2_y, "Approve/\nReject", (-80, 0))

# ---- USE CASE 3: Generate PDF Document ----
uc3_x, uc3_y = 500, 1350
draw_usecase_box(uc3_x, uc3_y, "3. Generate\nPDF\nDocument", "Signing")
draw_relationship(uc1_x, uc1_y+65, uc3_x, uc3_y-55, "PDF\ngener\nSigned PDF", (-100, -20))
draw_relationship(uc3_x+80, uc3_y, center_x-80, center_y+80, "Signed PDF", (-60, 30))

# ---- USE CASE 4: Payment Processing ----
uc4_x, uc4_y = 1400, 450
draw_usecase_box(uc4_x, uc4_y, "4. Payment\nProcessing\nGateway", "Status tracking")
draw_relationship(tenant_x-80, tenant_y+30, uc4_x+80, uc4_y, "Rent amount\nMonthly", (50, -20))
draw_relationship(uc4_x, uc4_y+60, center_x, center_y-60, "Payment status\nTransaction ID", (0, -40))
draw_relationship(uc4_x+80, uc4_y, notif_x-80, notif_y, "Payment\nreceipt", (50, -30))

# ---- USE CASE 5: Dispute Management ----
uc5_x, uc5_y = 1400, 1300
draw_usecase_box(uc5_x, uc5_y, "5. Dispute\nManagement\nFiling\nResolution", "")
draw_relationship(tenant_x-80, tenant_y+60, uc5_x+80, uc5_y-100, "Complaint\nEvidence", (80, -60))
draw_relationship(uc5_x, uc5_y-70, center_x, center_y+60, "Dispute\ndecision", (0, 40))
draw_relationship(uc5_x+80, uc5_y, admin_x-80, admin_y, "Dispute\nrecord\nResolution", (80, 40))
draw_relationship(admin_x-80, admin_y-30, uc5_x+80, uc5_y-100, "Review\ndispute", (80, -40))
draw_relationship(uc5_x, uc5_y+70, notif_x-80, notif_y+100, "Notification", (50, 40))

# ---- NOTIFICATION RELATIONSHIPS ----
draw_relationship(center_x+80, center_y, notif_x-80, notif_y, "Agreement\nsent", (80, -20))
draw_relationship(center_x+80, center_y+30, notif_x-80, notif_y-30, "Notification", (80, 0))
draw_relationship(tenant_x-80, tenant_y, notif_x-80, notif_y+30, "Notification", (50, 20))

# ---- DATA STORE CONNECTIONS ----
draw_relationship(uc1_x, uc1_y, center_x, center_y, "", (0, 0))
draw_relationship(uc2_x, uc2_y, center_x, center_y, "", (0, 0))
draw_relationship(uc3_x, uc3_y, center_x, center_y, "", (0, 0))
draw_relationship(uc4_x, uc4_y, center_x, center_y, "", (0, 0))
draw_relationship(uc5_x, uc5_y, center_x, center_y, "", (0, 0))

# ==================== FOOTER ====================
draw.text((width-150, height-40), 
          "Rentra - Professional UML Use Case Architecture", 
          fill=GRAY, font=small_font, anchor="rm")

# ==================== SAVE ====================
img.save('use-case-integrated.png')

try:
    import os
    file_size = os.path.getsize('use-case-integrated.png')
    size_kb = file_size / 1024
except:
    size_kb = 0

print("✅ PROFESSIONAL USE CASE DIAGRAM CREATED!")
print(f"   📊 File: use-case-integrated.png")
print(f"   📏 Resolution: {width}x{height} pixels")
print(f"   💾 Size: {size_kb:.1f} KB")
print(f"   🎨 Style: Professional Black & White")
print(f"   🔗 All data flow labels included")
print(f"   ✨ Layout: Actors on sides, Use cases in center")
