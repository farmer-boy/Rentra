#!/usr/bin/env python3
"""
Create an integrated use case diagram showing all subsystem interconnections
Perfect for showing how all modules communicate and work together
"""
import sys
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "-q"])
    from PIL import Image, ImageDraw, ImageFont

# Create ultra-professional high-resolution image
width, height = 2000, 1600
img = Image.new('RGB', (width, height), 'white')
draw = ImageDraw.Draw(img, 'RGBA')

# Load fonts
try:
    header_font = ImageFont.truetype("arial.ttf", 36)
    title_font = ImageFont.truetype("arial.ttf", 24)
    subsys_font = ImageFont.truetype("arial.ttf", 15)
    label_font = ImageFont.truetype("arial.ttf", 13)
    text_font = ImageFont.truetype("arial.ttf", 11)
    small_font = ImageFont.truetype("arial.ttf", 9)
except:
    header_font = title_font = subsys_font = label_font = text_font = small_font = ImageFont.load_default()

# Professional color palette
BLUE = (2, 132, 199)
LIGHT_BLUE = (219, 234, 254)
GREEN = (22, 163, 74)
LIGHT_GREEN = (220, 252, 231)
YELLOW = (202, 138, 4)
LIGHT_YELLOW = (254, 240, 138)
RED = (220, 38, 38)
LIGHT_RED = (254, 228, 230)
PURPLE = (139, 92, 246)
LIGHT_PURPLE = (243, 232, 255)
DARK = (26, 26, 26)
GRAY = (120, 120, 120)
LIGHT_GRAY = (230, 230, 230)

def draw_header():
    """Draw professional header"""
    draw.rectangle([0, 0, width, 120], fill=(102, 126, 234))
    draw.text((width//2, 40), "RENTRA SYSTEM - COMPLETE USE CASE ARCHITECTURE", 
              fill=(255, 255, 255), font=header_font, anchor="mm")
    draw.text((width//2, 85), "Integrated Module Interconnection Diagram",
              fill=(240, 240, 240), font=subsys_font, anchor="mm")

def draw_stick_figure(x, y, color, name):
    """Draw stick figure actor"""
    r = 18
    draw.ellipse([x-r, y-r, x+r, y+r], outline=color, width=3)
    draw.line([(x, y+r), (x, y+r+45)], fill=color, width=3)
    draw.line([(x, y+r+15), (x-30, y)], fill=color, width=3)
    draw.line([(x, y+r+15), (x+30, y)], fill=color, width=3)
    draw.line([(x, y+r+45), (x-18, y+r+75)], fill=color, width=3)
    draw.line([(x, y+r+45), (x+18, y+r+75)], fill=color, width=3)
    draw.text((x, y+r+95), name, fill=DARK, font=label_font, anchor="mm")

def draw_usecase(x, y, text, color_fill, color_outline, size=50):
    """Draw elliptical use case"""
    draw.ellipse([x-size, y-28, x+size, y+28], 
                 fill=color_fill, outline=color_outline, width=3)
    lines = text.split('\n')
    for i, line in enumerate(lines):
        offset = (i - len(lines)/2 + 0.5) * 13
        draw.text((x, y+offset), line, fill=DARK, font=text_font, anchor="mm")

def draw_relationship(x1, y1, x2, y2, color, rel_type="direct", label=""):
    """Draw relationship line"""
    import math
    
    # Draw line
    if rel_type == "include":
        # Dashed line for include
        steps = 25
        for i in range(steps):
            if i % 2 == 0:
                x_start = x1 + (x2 - x1) * i / steps
                y_start = y1 + (y2 - y1) * i / steps
                x_end = x1 + (x2 - x1) * (i + 0.7) / steps
                y_end = y1 + (y2 - y1) * (i + 0.7) / steps
                draw.line([(x_start, y_start), (x_end, y_end)], fill=color, width=2)
    elif rel_type == "extend":
        # Dot-dash line
        steps = 25
        for i in range(steps):
            if i % 3 != 2:
                x_start = x1 + (x2 - x1) * i / steps
                y_start = y1 + (y2 - y1) * i / steps
                x_end = x1 + (x2 - x1) * (i + 0.6) / steps
                y_end = y1 + (y2 - y1) * (i + 0.6) / steps
                draw.line([(x_start, y_start), (x_end, y_end)], fill=color, width=2)
    else:
        # Solid line
        draw.line([(x1, y1), (x2, y2)], fill=color, width=3)
    
    # Draw arrowhead
    angle = math.atan2(y2-y1, x2-x1)
    arrow_size = 10
    arrow_x1 = x2 - arrow_size * math.cos(angle - math.pi/6)
    arrow_y1 = y2 - arrow_size * math.sin(angle - math.pi/6)
    arrow_x2 = x2 - arrow_size * math.cos(angle + math.pi/6)
    arrow_y2 = y2 - arrow_size * math.sin(angle + math.pi/6)
    draw.polygon([(x2, y2), (arrow_x1, arrow_y1), (arrow_x2, arrow_y2)], fill=color)
    
    # Draw label
    if label:
        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        draw.text((mid_x, mid_y), label, fill=color, font=small_font)

# ==================== DRAW HEADER ====================
draw_header()

# Draw main system boundary
draw.rectangle([50, 150, 1950, 1550], outline=DARK, width=4)
draw.text((70, 170), "SYSTEM BOUNDARY", fill=(102, 126, 234), font=subsys_font)

# ==================== TENANT SUBSYSTEM (TOP LEFT) ====================
tenant_box_x, tenant_box_y = 80, 210
tenant_box_w, tenant_box_h = 380, 500

draw.rectangle([tenant_box_x, tenant_box_y, tenant_box_x+tenant_box_w, 
                tenant_box_y+tenant_box_h], outline=LIGHT_GRAY, width=2)
draw.text((tenant_box_x+20, tenant_box_y+15), "TENANT ACTOR", fill=DARK, font=subsys_font)

tenant_actor_x = tenant_box_x + 100
tenant_actor_y = tenant_box_y + 80
draw_stick_figure(tenant_actor_x, tenant_actor_y, BLUE, "Tenant")

# Tenant use cases
tenant_uc = [
    (tenant_box_x + 280, tenant_box_y + 80, "Search", LIGHT_BLUE, BLUE),
    (tenant_box_x + 280, tenant_box_y + 140, "Browse", LIGHT_BLUE, BLUE),
    (tenant_box_x + 280, tenant_box_y + 200, "Book", LIGHT_BLUE, BLUE),
    (tenant_box_x + 280, tenant_box_y + 260, "Pay", LIGHT_BLUE, BLUE),
    (tenant_box_x + 280, tenant_box_y + 320, "View Agr", LIGHT_BLUE, BLUE),
    (tenant_box_x + 280, tenant_box_y + 380, "Dispute", LIGHT_BLUE, BLUE),
    (tenant_box_x + 280, tenant_box_y + 440, "Rate", LIGHT_BLUE, BLUE),
]

for uc_x, uc_y, text, fill, outline in tenant_uc:
    draw_usecase(uc_x, uc_y, text, fill, outline, 45)
    draw_relationship(tenant_actor_x + 40, tenant_actor_y + 30, uc_x - 50, uc_y, DARK)

# ==================== LANDLORD SUBSYSTEM (TOP RIGHT) ====================
landlord_box_x, landlord_box_y = 1080, 210
landlord_box_w, landlord_box_h = 380, 500

draw.rectangle([landlord_box_x, landlord_box_y, landlord_box_x+landlord_box_w, 
                landlord_box_y+landlord_box_h], outline=LIGHT_GRAY, width=2)
draw.text((landlord_box_x+20, landlord_box_y+15), "LANDLORD ACTOR", fill=DARK, font=subsys_font)

landlord_actor_x = landlord_box_x + 100
landlord_actor_y = landlord_box_y + 80
draw_stick_figure(landlord_actor_x, landlord_actor_y, GREEN, "Landlord")

# Landlord use cases
landlord_uc = [
    (landlord_box_x + 280, landlord_box_y + 80, "Create", LIGHT_GREEN, GREEN),
    (landlord_box_x + 280, landlord_box_y + 140, "Manage", LIGHT_GREEN, GREEN),
    (landlord_box_x + 280, landlord_box_y + 200, "Approve", LIGHT_GREEN, GREEN),
    (landlord_box_x + 280, landlord_box_y + 260, "Revenue", LIGHT_GREEN, GREEN),
    (landlord_box_x + 280, landlord_box_y + 320, "Tenants", LIGHT_GREEN, GREEN),
    (landlord_box_x + 280, landlord_box_y + 380, "Set Rent", LIGHT_GREEN, GREEN),
    (landlord_box_x + 280, landlord_box_y + 440, "Bookings", LIGHT_GREEN, GREEN),
]

for uc_x, uc_y, text, fill, outline in landlord_uc:
    draw_usecase(uc_x, uc_y, text, fill, outline, 45)
    draw_relationship(landlord_actor_x - 40, landlord_actor_y + 30, uc_x + 50, uc_y, DARK)

# ==================== ADMIN SUBSYSTEM (BOTTOM LEFT) ====================
admin_box_x, admin_box_y = 80, 760
admin_box_w, admin_box_h = 380, 500

draw.rectangle([admin_box_x, admin_box_y, admin_box_x+admin_box_w, 
                admin_box_y+admin_box_h], outline=LIGHT_GRAY, width=2)
draw.text((admin_box_x+20, admin_box_y+15), "ADMIN ACTOR", fill=DARK, font=subsys_font)

admin_actor_x = admin_box_x + 100
admin_actor_y = admin_box_y + 80
draw_stick_figure(admin_actor_x, admin_actor_y, YELLOW, "Admin")

# Admin use cases
admin_uc = [
    (admin_box_x + 280, admin_box_y + 80, "Users", LIGHT_YELLOW, YELLOW),
    (admin_box_x + 280, admin_box_y + 140, "Resolve", LIGHT_YELLOW, YELLOW),
    (admin_box_x + 280, admin_box_y + 200, "Monitor", LIGHT_YELLOW, YELLOW),
    (admin_box_x + 280, admin_box_y + 260, "Reports", LIGHT_YELLOW, YELLOW),
    (admin_box_x + 280, admin_box_y + 320, "Content", LIGHT_YELLOW, YELLOW),
    (admin_box_x + 280, admin_box_y + 380, "Review", LIGHT_YELLOW, YELLOW),
    (admin_box_x + 280, admin_box_y + 440, "Analytics", LIGHT_YELLOW, YELLOW),
]

for uc_x, uc_y, text, fill, outline in admin_uc:
    draw_usecase(uc_x, uc_y, text, fill, outline, 45)
    draw_relationship(admin_actor_x + 40, admin_actor_y + 30, uc_x - 50, uc_y, DARK)

# ==================== EXTERNAL SYSTEMS (BOTTOM RIGHT) ====================
ext_box_x, ext_box_y = 1080, 760
ext_box_w, ext_box_h = 380, 500

draw.rectangle([ext_box_x, ext_box_y, ext_box_x+ext_box_w, 
                ext_box_y+ext_box_h], outline=LIGHT_GRAY, width=2)
draw.text((ext_box_x+20, ext_box_y+15), "EXTERNAL SYSTEMS", fill=DARK, font=subsys_font)

ai_actor_x = ext_box_x + 80
ai_actor_y = ext_box_y + 80
payment_actor_x = ext_box_x + 280
payment_actor_y = ext_box_y + 80

draw_stick_figure(ai_actor_x, ai_actor_y, RED, "AI Engine")
draw_stick_figure(payment_actor_x, payment_actor_y, RED, "Payment GW")

# External use cases
ext_uc = [
    (ext_box_x + 190, ext_box_y + 240, "Verify\nListing", LIGHT_RED, RED),
    (ext_box_x + 190, ext_box_y + 320, "Process\nPayment", LIGHT_RED, RED),
    (ext_box_x + 190, ext_box_y + 400, "Send\nNotify", LIGHT_RED, RED),
]

for uc_x, uc_y, text, fill, outline in ext_uc:
    draw_usecase(uc_x, uc_y, text, fill, outline, 45)

draw_relationship(ai_actor_x + 30, ai_actor_y + 80, ext_uc[0][0] - 40, ext_uc[0][1], RED)
draw_relationship(payment_actor_x - 30, payment_actor_y + 80, ext_uc[1][0] + 40, ext_uc[1][1], RED)

# ==================== CROSS-SUBSYSTEM RELATIONSHIPS ====================

# TENANT -> LANDLORD connections
# Tenant Book -> Landlord Approve
draw_relationship(325 + tenant_box_w, tenant_uc[2][1], 
                  landlord_box_x + 280 - 50, landlord_uc[2][1], 
                  PURPLE, "include", "<<include>>")

# TENANT -> EXTERNAL connections
# Tenant Pay -> Payment Process
draw_relationship(325 + tenant_box_w, tenant_uc[3][1], 
                  ext_box_x + 190, ext_uc[1][1] - 30, 
                  RED, "include", "<<include>>")

# LANDLORD -> EXTERNAL connections
# Landlord Create -> AI Verify
draw_relationship(landlord_box_x, landlord_uc[0][1], 
                  ext_box_x + 190 - 50, ext_uc[0][1] + 30, 
                  RED, "include", "<<include>>")

# TENANT -> ADMIN connections
# Tenant Dispute -> Admin Resolve
draw_relationship(325 + tenant_box_w, tenant_uc[5][1], 
                  admin_box_x + 50, admin_uc[1][1], 
                  YELLOW, "include", "<<include>>")

# LANDLORD -> ADMIN connections
# Landlord Manage -> Admin Monitor
draw_relationship(landlord_box_x, landlord_uc[1][1], 
                  admin_box_x + 280 + 50, admin_uc[2][1], 
                  YELLOW, "include", "<<include>>")

# EXTERNAL -> ADMIN connections (extend)
# Notification extends multiple operations
draw_relationship(ext_box_x + 190, ext_uc[2][1], 
                  admin_box_x + 280, admin_uc[6][1] - 30, 
                  (0, 150, 200), "extend", "<<extend>>")

# ADMIN -> TENANT (View Analytics triggers Reports)
draw_relationship(admin_box_x + 280 + 50, admin_uc[3][1], 
                  tenant_box_x + 280 - 50, tenant_uc[6][1], 
                  (150, 100, 200), "extend", "<<extend>>")

# ==================== CENTER HUB - Core Business Logic ====================
hub_x, hub_y = 950, 800
hub_size = 120

# Central coordination circle
draw.rectangle([hub_x - hub_size, hub_y - hub_size, 
                hub_x + hub_size, hub_y + hub_size], 
               outline=PURPLE, width=3)
draw.text((hub_x, hub_y - 20), "CORE", fill=PURPLE, font=label_font, anchor="mm")
draw.text((hub_x, hub_y + 10), "SYSTEM", fill=PURPLE, font=label_font, anchor="mm")

# Draw connections from all modules to core
# Tenant connections to core
draw_relationship(tenant_box_x + tenant_box_w - 50, tenant_box_y + 300,
                  hub_x - hub_size - 20, hub_y, BLUE, "direct")

# Landlord connections to core
draw_relationship(landlord_box_x + 50, landlord_box_y + 300,
                  hub_x + hub_size + 20, hub_y, GREEN, "direct")

# Admin connections to core
draw_relationship(admin_box_x + admin_box_w - 50, admin_box_y + 300,
                  hub_x - hub_size - 20, hub_y, YELLOW, "direct")

# External connections to core
draw_relationship(ext_box_x + 50, ext_box_y + 300,
                  hub_x + hub_size + 20, hub_y, RED, "direct")

# ==================== LEGEND ====================
legend_y = 1500
draw.rectangle([50, legend_y - 40, 1950, legend_y + 60], 
               fill=(245, 245, 245), outline=LIGHT_GRAY, width=2)

legend_items = [
    (BLUE, "Tenant Module"),
    (GREEN, "Landlord Module"),
    (YELLOW, "Admin Module"),
    (RED, "External Systems"),
    (PURPLE, "Core System"),
]

x = 100
for color, label in legend_items:
    draw.ellipse([x-10, legend_y-10-10, x+10, legend_y-10+10], 
                 outline=color, width=2)
    draw.text((x+25, legend_y-5), label, fill=DARK, font=text_font)
    x += 300

# Relationship legend
x = 100
legend_y_rel = legend_y + 25
draw.line([(x, legend_y_rel), (x+30, legend_y_rel)], fill=DARK, width=2)
draw.text((x+40, legend_y_rel-5), "Direct Use", fill=DARK, font=text_font)

x = 450
# Dashed line
for i in range(4):
    draw.line([(x + i*8, legend_y_rel), (x + i*8+5, legend_y_rel)], fill=GRAY, width=2)
draw.text((x+40, legend_y_rel-5), "<<include>> Use", fill=DARK, font=text_font)

x = 850
# Dotted line
for i in range(6):
    if i % 2 == 0:
        draw.line([(x + i*6, legend_y_rel), (x + i*6+3, legend_y_rel)], fill=(0, 150, 200), width=2)
draw.text((x+40, legend_y_rel-5), "<<extend>> Use", fill=DARK, font=text_font)

# Footer
draw.text((width//2, legend_y + 50), 
          "Integrated Use Case Architecture | All Subsystems Interconnected | Ready for FYP Submission",
          fill=GRAY, font=small_font, anchor="mm")

# Save image
output_path = "use-case-integrated.png"
img.save(output_path, 'PNG', quality=95)

import os
size = os.path.getsize(output_path)
print(f"✅ INTEGRATED DIAGRAM CREATED!")
print(f"   📊 File: {output_path}")
print(f"   📏 Resolution: {width}x{height} pixels")
print(f"   💾 Size: {size:,} bytes ({size/1024:.1f} KB)")
print(f"   🔗 Shows: All subsystems interconnected")
print(f"   ✨ Perfect for understanding complete system flow!")
