#!/usr/bin/env python3
"""
Domain Model Diagram - HD Quality PNG
Same structure: Entity + Service + Controller for each of 8 main entities
24 boxes total (8 entities × 3 components)
"""
import sys
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "-q"])
    from PIL import Image, ImageDraw, ImageFont

# Create HD image
width, height = 3600, 2800
img = Image.new('RGB', (width, height), 'white')
draw = ImageDraw.Draw(img, 'RGBA')

# Load fonts
try:
    header_font = ImageFont.truetype("arial.ttf", 52)
    domain_font = ImageFont.truetype("arial.ttf", 32)
    box_font = ImageFont.truetype("arial.ttf", 14)
    label_font = ImageFont.truetype("arial.ttf", 12)
except:
    header_font = domain_font = box_font = label_font = ImageFont.load_default()

# Colors
BLACK = (0, 0, 0)
DARK_GRAY = (60, 60, 60)
GRAY = (120, 120, 120)
LIGHT_GRAY = (220, 220, 220)
ENTITY_COLOR = (200, 220, 255)
SERVICE_COLOR = (220, 255, 200)
CONTROLLER_COLOR = (255, 240, 200)

def draw_box(x, y, width_box, height_box, title, subtitle, color):
    """Draw a rounded rectangle box"""
    # Background
    draw.rectangle([x-width_box//2, y-height_box//2, x+width_box//2, y+height_box//2],
                   fill=color, outline=BLACK, width=2)
    
    # Title
    draw.text((x, y-20), title, fill=BLACK, font=box_font, anchor="mm", align="center")
    
    # Subtitle
    if subtitle:
        draw.text((x, y+15), subtitle, fill=DARK_GRAY, font=label_font, anchor="mm")

def draw_arrow(x1, y1, x2, y2):
    """Draw arrow between boxes"""
    draw.line([(x1, y1), (x2, y2)], fill=GRAY, width=2)
    # Arrowhead
    import math
    angle = math.atan2(y2-y1, x2-x1)
    arrow_size = 8
    arrow_x1 = x2 - arrow_size * math.cos(angle - math.pi/6)
    arrow_y1 = y2 - arrow_size * math.sin(angle - math.pi/6)
    arrow_x2 = x2 - arrow_size * math.cos(angle + math.pi/6)
    arrow_y2 = y2 - arrow_size * math.sin(angle + math.pi/6)
    draw.polygon([(x2, y2), (arrow_x1, arrow_y1), (arrow_x2, arrow_y2)], fill=GRAY)

# ==================== HEADER ====================
draw.text((width//2, 60), "RENTRA DOMAIN MODEL", fill=BLACK, font=header_font, anchor="mm")
draw.text((width//2, 125), "8 Core Domains × 3 Components = 24 Core Boxes", 
          fill=GRAY, font=domain_font, anchor="mm")

# ==================== ENTITIES & COMPONENTS ====================
entities = [
    ("User\nManagement", ["User", "UserService", "UserController"]),
    ("Listing\nManagement", ["Listing", "ListingService", "ListingController"]),
    ("Agreement\nManagement", ["Agreement", "AgreementService", "AgreementController"]),
    ("Payment\nProcessing", ["Payment", "PaymentService", "PaymentController"]),
    ("Dispute\nResolution", ["Dispute", "DisputeService", "DisputeController"]),
    ("Review &\nRating", ["Review", "ReviewService", "ReviewController"]),
    ("Messaging\nSystem", ["Message", "MessageService", "MessageController"]),
    ("Conversation\nTracking", ["Conversation", "ConversationService", "ConversationController"]),
]

box_width = 180
box_height = 100
row_height = 450
col_width = 900
start_x = 200
start_y = 300

# Draw entities in grid
row = 0
col = 0

for entity_name, components in entities:
    # Domain title
    domain_x = start_x + col * col_width
    domain_y = start_y + row * row_height - 120
    
    draw.text((domain_x + 220, domain_y), entity_name, fill=DARK_GRAY, font=domain_font, anchor="mm")
    
    # Draw 3 boxes for each entity
    y_base = start_y + row * row_height
    
    # Entity box
    entity_x = domain_x + 50
    draw_box(entity_x, y_base, box_width, box_height, components[0], "Entity", ENTITY_COLOR)
    
    # Service box
    service_x = domain_x + 220
    draw_box(service_x, y_base, box_width, box_height, components[1], "Service", SERVICE_COLOR)
    
    # Controller box
    controller_x = domain_x + 390
    draw_box(controller_x, y_base, box_width, box_height, components[2], "Controller", CONTROLLER_COLOR)
    
    # Draw arrows between boxes
    draw_arrow(entity_x + 100, y_base, service_x - 100, y_base)
    draw_arrow(service_x + 100, y_base, controller_x - 100, y_base)
    
    # Move to next position
    col += 1
    if col >= 2:
        col = 0
        row += 1

# ==================== LEGEND ====================
legend_y = height - 250

draw.text((200, legend_y), "LEGEND:", fill=BLACK, font=box_font)
draw.rectangle([200, legend_y+30, 280, legend_y+60], fill=ENTITY_COLOR, outline=BLACK, width=1)
draw.text((300, legend_y+45), "Entity Box", fill=BLACK, font=label_font, anchor="lm")

draw.rectangle([200, legend_y+80, 280, legend_y+110], fill=SERVICE_COLOR, outline=BLACK, width=1)
draw.text((300, legend_y+95), "Service Component", fill=BLACK, font=label_font, anchor="lm")

draw.rectangle([200, legend_y+130, 280, legend_y+160], fill=CONTROLLER_COLOR, outline=BLACK, width=1)
draw.text((300, legend_y+145), "Controller Component", fill=BLACK, font=label_font, anchor="lm")

draw.text((1200, legend_y), "Total Boxes: 24 (8 domains × 3 components)", 
          fill=DARK_GRAY, font=label_font)

# ==================== FOOTER ====================
draw.text((width-200, height-60), "Domain Model Architecture | HD Quality", 
          fill=GRAY, font=label_font, anchor="rm")

# ==================== SAVE ====================
img.save('2-domain-model.png')

try:
    import os
    file_size = os.path.getsize('2-domain-model.png')
    size_kb = file_size / 1024
except:
    size_kb = 0

print("✅ DOMAIN MODEL PNG CREATED!")
print(f"   📊 File: 2-domain-model.png")
print(f"   📏 Resolution: {width}x{height} pixels (HD)")
print(f"   💾 Size: {size_kb:.1f} KB")
print(f"   📦 Boxes: 24 (8 entities × 3 components)")
