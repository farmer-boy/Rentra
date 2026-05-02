#!/usr/bin/env python3
"""
Create integrated diagram with actors on sides and use cases in middle
Layout: 2 actors LEFT | All use cases CENTER | 2 actors RIGHT
"""
import sys
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "-q"])
    from PIL import Image, ImageDraw, ImageFont

# Create ultra-professional high-resolution image
width, height = 2200, 1600
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
    draw.text((width//2, 85), "Integrated Architecture: Actors & Use Cases",
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

def draw_usecase(x, y, text, color_fill, color_outline, size=48):
    """Draw elliptical use case"""
    draw.ellipse([x-size, y-26, x+size, y+26], 
                 fill=color_fill, outline=color_outline, width=3)
    lines = text.split('\n')
    for i, line in enumerate(lines):
        offset = (i - len(lines)/2 + 0.5) * 11
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
boundary_left = 50
boundary_right = width - 50
boundary_top = 150
boundary_bottom = height - 100

draw.rectangle([boundary_left, boundary_top, boundary_right, boundary_bottom], outline=DARK, width=4)
draw.text((70, 170), "SYSTEM BOUNDARY", fill=(102, 126, 234), font=subsys_font)

# ==================== LEFT SIDE - ACTORS ====================
# Tenant (top-left)
tenant_x = 120
tenant_y = 350
draw_stick_figure(tenant_x, tenant_y, BLUE, "Tenant")

# Landlord (bottom-left)
landlord_x = 120
landlord_y = 1000
draw_stick_figure(landlord_x, landlord_y, GREEN, "Landlord")

# ==================== RIGHT SIDE - ACTORS ====================
# Admin (top-right)
admin_x = width - 120
admin_y = 350
draw_stick_figure(admin_x, admin_y, YELLOW, "Admin")

# External Systems (bottom-right)
external_x = width - 120
external_y = 1000
draw_stick_figure(external_x, external_y, RED, "External")

# ==================== CENTER - CORE SYSTEM & USE CASES ====================
center_x = width // 2
center_y = height // 2 - 100

# Draw core system circle
core_radius = 50
draw.ellipse([center_x - core_radius, center_y - core_radius, 
              center_x + core_radius, center_y + core_radius],
             fill=LIGHT_PURPLE, outline=PURPLE, width=3)
draw.text((center_x, center_y), "CORE\nSYSTEM", fill=DARK, font=label_font, anchor="mm")

# ==================== TENANT USE CASES (Left-Center area) ====================
tenant_uc_positions = [
    (350, 250, "Search\nListings", LIGHT_BLUE, BLUE),
    (350, 330, "Browse", LIGHT_BLUE, BLUE),
    (350, 410, "Book\nProperty", LIGHT_BLUE, BLUE),
    (450, 470, "Make\nPayment", LIGHT_BLUE, BLUE),
    (350, 550, "View\nAgreement", LIGHT_BLUE, BLUE),
    (450, 610, "Raise\nDispute", LIGHT_BLUE, BLUE),
    (350, 690, "Rate &\nReview", LIGHT_BLUE, BLUE),
]

for uc_x, uc_y, text, fill, outline in tenant_uc_positions:
    draw_usecase(uc_x, uc_y, text, fill, outline, 42)
    # Connect to tenant actor
    draw_relationship(tenant_x + 40, tenant_y + 30, uc_x - 45, uc_y, DARK)
    # Connect to core system
    draw_relationship(uc_x + 45, uc_y, center_x - core_radius, center_y, BLUE)

# ==================== LANDLORD USE CASES (Left-Center area, lower) ====================
landlord_uc_positions = [
    (350, 850, "Create\nListing", LIGHT_GREEN, GREEN),
    (450, 910, "Manage\nProperty", LIGHT_GREEN, GREEN),
    (350, 990, "View\nBookings", LIGHT_GREEN, GREEN),
    (450, 1050, "Approve\nRequest", LIGHT_GREEN, GREEN),
    (350, 1130, "Manage\nAgreement", LIGHT_GREEN, GREEN),
    (450, 1190, "Upload\nDocuments", LIGHT_GREEN, GREEN),
    (350, 1270, "View\nAnalytics", LIGHT_GREEN, GREEN),
]

for uc_x, uc_y, text, fill, outline in landlord_uc_positions:
    draw_usecase(uc_x, uc_y, text, fill, outline, 42)
    # Connect to landlord actor
    draw_relationship(landlord_x + 40, landlord_y - 30, uc_x - 45, uc_y, DARK)
    # Connect to core system
    draw_relationship(uc_x + 45, uc_y, center_x - core_radius, center_y, GREEN)

# ==================== ADMIN USE CASES (Right-Center area, upper) ====================
admin_uc_positions = [
    (1850, 250, "View\nUsers", LIGHT_YELLOW, YELLOW),
    (1750, 310, "Manage\nDisputes", LIGHT_YELLOW, YELLOW),
    (1850, 370, "Generate\nReports", LIGHT_YELLOW, YELLOW),
    (1750, 430, "Verify\nListings", LIGHT_YELLOW, YELLOW),
    (1850, 490, "Monitor\nPayments", LIGHT_YELLOW, YELLOW),
    (1750, 550, "Manage\nAgreements", LIGHT_YELLOW, YELLOW),
    (1850, 610, "Configure\nSystem", LIGHT_YELLOW, YELLOW),
]

for uc_x, uc_y, text, fill, outline in admin_uc_positions:
    draw_usecase(uc_x, uc_y, text, fill, outline, 42)
    # Connect to admin actor
    draw_relationship(admin_x - 40, admin_y + 30, uc_x + 45, uc_y, DARK)
    # Connect to core system
    draw_relationship(uc_x - 45, uc_y, center_x + core_radius, center_y, YELLOW)

# ==================== EXTERNAL SYSTEMS USE CASES (Right-Center area, lower) ====================
external_uc_positions = [
    (1850, 850, "Process\nPayment", LIGHT_RED, RED),
    (1750, 910, "Send\nNotification", LIGHT_RED, RED),
    (1850, 990, "Verify\nIdentity", LIGHT_RED, RED),
    (1750, 1050, "Store\nDocuments", LIGHT_RED, RED),
    (1850, 1130, "Generate\nReport", LIGHT_RED, RED),
    (1750, 1190, "Send\nEmail", LIGHT_RED, RED),
    (1850, 1270, "Analytics\nTracking", LIGHT_RED, RED),
]

for uc_x, uc_y, text, fill, outline in external_uc_positions:
    draw_usecase(uc_x, uc_y, text, fill, outline, 42)
    # Connect to external actor
    draw_relationship(external_x - 40, external_y - 30, uc_x + 45, uc_y, DARK)
    # Connect to core system
    draw_relationship(uc_x - 45, uc_y, center_x + core_radius, center_y, RED)

# ==================== INTER-SUBSYSTEM RELATIONSHIPS ====================
# Tenant -> Landlord: Book -> Approve
draw_relationship(450, 410, 350, 1050, BLUE, "include", "<<include>>")

# Tenant -> External: Pay -> Process Payment
draw_relationship(450, 470, 1850, 850, BLUE, "include", "<<include>>")

# Landlord -> External: Create -> Verify Identity
draw_relationship(450, 910, 1850, 990, GREEN, "include", "<<include>>")

# Tenant -> Admin: Dispute -> Manage
draw_relationship(450, 610, 1750, 430, BLUE, "extend", "<<extend>>")

# Landlord -> Admin: Manage -> Manage
draw_relationship(450, 1050, 1750, 550, GREEN, "extend", "<<extend>>")

# ==================== LEGEND ====================
legend_y = height - 90

draw.rectangle([60, legend_y-5, 600, legend_y+40], outline=GRAY, width=1)
draw.text((70, legend_y), "● TENANT (Blue)  ● LANDLORD (Green)  ● ADMIN (Yellow)  ● EXTERNAL (Red)", 
          fill=DARK, font=small_font)

draw.rectangle([620, legend_y-5, 1200, legend_y+40], outline=GRAY, width=1)
draw.text((630, legend_y), "━━ Direct  ╌╌ <<include>>  ╌·╌ <<extend>>", 
          fill=DARK, font=small_font)

# ==================== FOOTER ====================
draw.text((width-70, height-35), "Rentra Property Management System | Complete Architecture View", 
          fill=GRAY, font=small_font, anchor="rm")

# ==================== SAVE ====================
img.save('use-case-integrated.png')

print("✅ INTEGRATED DIAGRAM CREATED (ACTORS ON SIDES)!")
print(f"   📊 File: use-case-integrated.png")
print(f"   📏 Resolution: {width}x{height} pixels")
print(f"   💾 Size: {len(img.tobytes())} bytes (est. 90-100 KB)")
print(f"   🔗 Layout: Actors on Left/Right, Use Cases in Center")
print(f"   ✨ Perfect for understanding complete system architecture!")
