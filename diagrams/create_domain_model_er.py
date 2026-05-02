#!/usr/bin/env python3
"""
Domain Model Diagram - ER Style (Like Reference Image)
Professional black & white with relationships and attributes
"""
import sys
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "-q"])
    from PIL import Image, ImageDraw, ImageFont

import math

# Create HD image
width, height = 4000, 3000
img = Image.new('RGB', (width, height), 'white')
draw = ImageDraw.Draw(img, 'RGBA')

# Load fonts
try:
    header_font = ImageFont.truetype("arial.ttf", 48)
    title_font = ImageFont.truetype("arial.ttf", 22)
    box_font = ImageFont.truetype("arial.ttf", 13)
    attr_font = ImageFont.truetype("arial.ttf", 10)
    label_font = ImageFont.truetype("arial.ttf", 9)
except:
    header_font = title_font = box_font = attr_font = label_font = ImageFont.load_default()

BLACK = (0, 0, 0)
DARK_GRAY = (50, 50, 50)
GRAY = (120, 120, 120)
LIGHT_GRAY = (240, 240, 240)

def draw_entity_box(x, y, width_box, height_box, title, attributes):
    """Draw entity box with attributes like ER diagram"""
    # Border
    draw.rectangle([x-width_box//2, y-height_box//2, x+width_box//2, y+height_box//2],
                   outline=BLACK, fill=(255, 255, 255), width=2)
    
    # Title bar
    title_height = 28
    draw.rectangle([x-width_box//2, y-height_box//2, x+width_box//2, y-height_box//2+title_height],
                   outline=BLACK, fill=LIGHT_GRAY, width=1)
    draw.text((x, y-height_box//2+14), title, fill=BLACK, font=box_font, anchor="mm", align="center")
    
    # Divider
    draw.line([(x-width_box//2, y-height_box//2+title_height), (x+width_box//2, y-height_box//2+title_height)],
              fill=BLACK, width=1)
    
    # Attributes
    attr_y = y - height_box//2 + title_height + 10
    for attr in attributes[:4]:
        draw.text((x-width_box//2+8, attr_y), attr, fill=DARK_GRAY, font=attr_font, anchor="lm")
        attr_y += 16

def draw_relationship(x1, y1, x2, y2, label="", curve=False):
    """Draw relationship line with label"""
    if curve:
        # Draw curved line
        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        offset = 30
        # Simple quadratic curve approximation
        for t in [i/20.0 for i in range(21)]:
            curve_x1 = x1 + (mid_x - x1) * t
            curve_y1 = y1 + (mid_y - offset - y1) * t
            curve_x2 = x1 + (x2 - x1) * t
            curve_y2 = y1 + (y2 - y1) * t
            blend_x = curve_x1 + (curve_x2 - curve_x1) * t
            blend_y = curve_y1 + (curve_y2 - curve_y1) * t
            if t > 0:
                draw.line([(prev_x, prev_y), (blend_x, blend_y)], fill=BLACK, width=2)
            prev_x, prev_y = blend_x, blend_y
    else:
        # Straight line
        draw.line([(x1, y1), (x2, y2)], fill=BLACK, width=2)
    
    # Arrow
    angle = math.atan2(y2-y1, x2-x1)
    arrow_size = 10
    arrow_x1 = x2 - arrow_size * math.cos(angle - math.pi/6)
    arrow_y1 = y2 - arrow_size * math.sin(angle - math.pi/6)
    arrow_x2 = x2 - arrow_size * math.cos(angle + math.pi/6)
    arrow_y2 = y2 - arrow_size * math.sin(angle + math.pi/6)
    draw.polygon([(x2, y2), (arrow_x1, arrow_y1), (arrow_x2, arrow_y2)], fill=BLACK)
    
    # Label
    if label:
        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        # Background for label
        label_bbox = draw.textbbox((mid_x, mid_y), label, font=label_font, anchor="mm")
        draw.rectangle([label_bbox[0]-3, label_bbox[1]-2, label_bbox[2]+3, label_bbox[3]+2],
                      fill='white', outline=BLACK, width=1)
        draw.text((mid_x, mid_y), label, fill=BLACK, font=label_font, anchor="mm")

# ==================== HEADER ====================
draw.text((width//2, 50), "RENTRA DOMAIN MODEL", fill=BLACK, font=header_font, anchor="mm")
draw.text((width//2, 105), "Entity Relationship Diagram - 8 Core Domains with Services & Controllers", 
          fill=GRAY, font=title_font, anchor="mm")

# ==================== ENTITIES DATA ====================
entities = {
    "User": {
        "pos": (400, 400),
        "size": (160, 120),
        "attrs": ["- id, email, phone", "- cnic (unique)", "- fullName, role", "- trustScore 0-100"]
    },
    "UserService": {
        "pos": (650, 400),
        "size": (140, 100),
        "attrs": ["+ register()", "+ login()", "+ getProfile()", "+ verify()"]
    },
    "UserController": {
        "pos": (850, 400),
        "size": (140, 100),
        "attrs": ["POST /register", "POST /login", "GET /profile", "PATCH /verify"]
    },
    
    "Listing": {
        "pos": (1200, 400),
        "size": (160, 120),
        "attrs": ["- id, title, address", "- rent, deposit", "- status, photos[]", "- fraudScore"]
    },
    "ListingService": {
        "pos": (1450, 400),
        "size": (140, 100),
        "attrs": ["+ create()", "+ findAll()", "+ update()", "+ checkFraud()"]
    },
    "ListingController": {
        "pos": (1650, 400),
        "size": (140, 100),
        "attrs": ["POST /listings", "GET /listings", "PATCH /:id", "GET /fraud"]
    },
    
    "Agreement": {
        "pos": (400, 750),
        "size": (160, 120),
        "attrs": ["- id, listingId", "- tenantId, landlordId", "- rent, deposit", "- startDate, endDate"]
    },
    "AgreementService": {
        "pos": (650, 750),
        "size": (140, 100),
        "attrs": ["+ create()", "+ approve()", "+ generatePDF()", "+ terminate()"]
    },
    "AgreementController": {
        "pos": (850, 750),
        "size": (140, 100),
        "attrs": ["POST /agreements", "PATCH /approve", "GET /pdf", "DELETE /:id"]
    },
    
    "Payment": {
        "pos": (1200, 750),
        "size": (160, 120),
        "attrs": ["- id, agreementId", "- tenantId, amount", "- method, status", "- transactionId"]
    },
    "PaymentService": {
        "pos": (1450, 750),
        "size": (140, 100),
        "attrs": ["+ process()", "+ complete()", "+ fail()", "+ getHistory()"]
    },
    "PaymentController": {
        "pos": (1650, 750),
        "size": (140, 100),
        "attrs": ["POST /payments", "PATCH /complete", "GET /history", "PATCH /fail"]
    },
    
    "Dispute": {
        "pos": (400, 1100),
        "size": (160, 120),
        "attrs": ["- id, agreementId", "- tenantId, title", "- description, amount", "- status, resolution"]
    },
    "DisputeService": {
        "pos": (650, 1100),
        "size": (140, 100),
        "attrs": ["+ create()", "+ resolve()", "+ escalate()", "+ getHistory()"]
    },
    "DisputeController": {
        "pos": (850, 1100),
        "size": (140, 100),
        "attrs": ["POST /disputes", "PATCH /resolve", "GET /escalated", "GET /history"]
    },
    
    "Review": {
        "pos": (1200, 1100),
        "size": (160, 120),
        "attrs": ["- id, listingId", "- userId, rating", "- comment", "- createdAt"]
    },
    "ReviewService": {
        "pos": (1450, 1100),
        "size": (140, 100),
        "attrs": ["+ create()", "+ getByListing()", "+ update()", "+ delete()"]
    },
    "ReviewController": {
        "pos": (1650, 1100),
        "size": (140, 100),
        "attrs": ["POST /reviews", "GET /listing/:id", "PATCH /:id", "DELETE /:id"]
    },
    
    "Conversation": {
        "pos": (400, 1450),
        "size": (160, 120),
        "attrs": ["- id, participant1Id", "- participant2Id", "- listingId", "- lastMessageAt"]
    },
    "ConversationService": {
        "pos": (650, 1450),
        "size": (140, 100),
        "attrs": ["+ create()", "+ getAll()", "+ getMessages()", "+ delete()"]
    },
    "ConversationController": {
        "pos": (850, 1450),
        "size": (140, 100),
        "attrs": ["POST /conversations", "GET /my", "GET /messages", "DELETE /:id"]
    },
    
    "Message": {
        "pos": (1200, 1450),
        "size": (160, 120),
        "attrs": ["- id, conversationId", "- senderId, content", "- isRead, readAt", "- attachmentUrl"]
    },
    "MessageService": {
        "pos": (1450, 1450),
        "size": (140, 100),
        "attrs": ["+ create()", "+ getByConversation()", "+ markAsRead()", "+ delete()"]
    },
    "MessageController": {
        "pos": (1650, 1450),
        "size": (140, 100),
        "attrs": ["POST /messages", "GET /conversation", "PATCH /read", "DELETE /:id"]
    },
}

# Draw all entities
for name, data in entities.items():
    draw_entity_box(data["pos"][0], data["pos"][1], data["size"][0], data["size"][1], name, data["attrs"])

# ==================== RELATIONSHIPS ====================
# User relationships
draw_relationship(525, 460, 400, 630, "creates", False)  # User -> Listing
draw_relationship(525, 460, 400, 810, "signs", False)    # User -> Agreement
draw_relationship(525, 460, 1200, 810, "makes", True)    # User -> Payment
draw_relationship(525, 460, 400, 1160, "files", False)   # User -> Dispute
draw_relationship(525, 460, 1200, 1160, "writes", True)  # User -> Review
draw_relationship(525, 460, 400, 1510, "participates", False)  # User -> Conversation

# Listing relationships
draw_relationship(1200, 460, 400, 630, "listed by", True)
draw_relationship(1200, 460, 400, 810, "included in", True)
draw_relationship(1200, 460, 1200, 1160, "has", False)

# Agreement relationships
draw_relationship(400, 810, 1200, 810, "requires", False)
draw_relationship(400, 810, 400, 1160, "may have", False)

# Payment relationships
draw_relationship(1200, 810, 400, 1160, "related to", True)

# Review relationships
draw_relationship(1200, 1160, 1200, 1510, "affects", False)

# Conversation relationships
draw_relationship(400, 1510, 1200, 1510, "contains", False)

# Service relationships (3 boxes per entity connected)
# User domain
draw_relationship(520, 430, 650, 430, "uses", False)
draw_relationship(745, 430, 850, 430, "calls", False)

# Listing domain
draw_relationship(1325, 430, 1450, 430, "uses", False)
draw_relationship(1545, 430, 1650, 430, "calls", False)

# Agreement domain
draw_relationship(520, 780, 650, 780, "uses", False)
draw_relationship(745, 780, 850, 780, "calls", False)

# Payment domain
draw_relationship(1325, 780, 1450, 780, "uses", False)
draw_relationship(1545, 780, 1650, 780, "calls", False)

# Dispute domain
draw_relationship(520, 1130, 650, 1130, "uses", False)
draw_relationship(745, 1130, 850, 1130, "calls", False)

# Review domain
draw_relationship(1325, 1130, 1450, 1130, "uses", False)
draw_relationship(1545, 1130, 1650, 1130, "calls", False)

# Conversation domain
draw_relationship(520, 1480, 650, 1480, "uses", False)
draw_relationship(745, 1480, 850, 1480, "calls", False)

# Message domain
draw_relationship(1325, 1480, 1450, 1480, "uses", False)
draw_relationship(1545, 1480, 1650, 1480, "calls", False)

# ==================== LEGEND ====================
legend_y = height - 350

draw.text((200, legend_y), "STRUCTURE:", fill=BLACK, font=box_font)
draw.rectangle([200, legend_y+30, 320, legend_y+70], outline=BLACK, fill=(255,255,255), width=2)
draw.text((260, legend_y+50), "Entity", fill=BLACK, font=label_font, anchor="mm")

draw.rectangle([340, legend_y+30, 460, legend_y+70], outline=BLACK, fill=(240,240,240), width=2)
draw.text((400, legend_y+50), "Service", fill=BLACK, font=label_font, anchor="mm")

draw.rectangle([480, legend_y+30, 600, legend_y+70], outline=BLACK, fill=(240,240,240), width=2)
draw.text((540, legend_y+50), "Controller", fill=BLACK, font=label_font, anchor="mm")

draw.text((800, legend_y), "Total Components: 24 (8 Domains × 3)", fill=DARK_GRAY, font=label_font)

# ==================== FOOTER ====================
draw.text((width-200, height-60), "Domain Model - Professional Architecture | Black & White", 
          fill=GRAY, font=label_font, anchor="rm")

# ==================== SAVE ====================
img.save('2-domain-model.png')

try:
    import os
    file_size = os.path.getsize('2-domain-model.png')
    size_kb = file_size / 1024
except:
    size_kb = 0

print("✅ DOMAIN MODEL PNG CREATED (ER STYLE)!")
print(f"   📊 File: 2-domain-model.png")
print(f"   📏 Resolution: {width}x{height} pixels (HD)")
print(f"   💾 Size: {size_kb:.1f} KB")
print(f"   📦 Components: 24 (8 domains × 3)")
print(f"   🎨 Style: Black & White ER Diagram")
