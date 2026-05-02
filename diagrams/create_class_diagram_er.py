#!/usr/bin/env python3
"""
Class Diagram - ER Style (Like Domain Model)
Professional black & white with relationships
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

def draw_class_box(x, y, width_box, height_box, title, attributes):
    """Draw class box with attributes"""
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
        for t in [i/20.0 for i in range(21)]:
            offset = 30 * math.sin(t * math.pi)
            mid_x = (x1 + x2) / 2
            mid_y = (y1 + y2) / 2
            perp_x = -(y2 - y1) / math.sqrt((x2-x1)**2 + (y2-y1)**2) if (x2-x1)**2 + (y2-y1)**2 > 0 else 0
            perp_y = (x2 - x1) / math.sqrt((x2-x1)**2 + (y2-y1)**2) if (x2-x1)**2 + (y2-y1)**2 > 0 else 0
            curve_x = x1 + (x2 - x1) * t + perp_x * offset
            curve_y = y1 + (y2 - y1) * t + perp_y * offset
            if t > 0:
                draw.line([(prev_x, prev_y), (curve_x, curve_y)], fill=BLACK, width=2)
            prev_x, prev_y = curve_x, curve_y
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
        label_bbox = draw.textbbox((mid_x, mid_y), label, font=label_font, anchor="mm")
        draw.rectangle([label_bbox[0]-3, label_bbox[1]-2, label_bbox[2]+3, label_bbox[3]+2],
                      fill='white', outline=BLACK, width=1)
        draw.text((mid_x, mid_y), label, fill=BLACK, font=label_font, anchor="mm")

# ==================== HEADER ====================
draw.text((width//2, 50), "RENTRA CLASS DIAGRAM", fill=BLACK, font=header_font, anchor="mm")
draw.text((width//2, 105), "Class Relationship Diagram - 8 Core Classes with Services & Controllers", 
          fill=GRAY, font=title_font, anchor="mm")

# ==================== CLASSES DATA ====================
classes = {
    "User": {
        "pos": (400, 400),
        "size": (160, 120),
        "attrs": ["id: string", "email: string", "cnic: string", "role: Role"]
    },
    "UserService": {
        "pos": (650, 400),
        "size": (140, 100),
        "attrs": ["register(): void", "login(): void", "getProfile(): User", "verify(): void"]
    },
    "UserController": {
        "pos": (850, 400),
        "size": (140, 100),
        "attrs": ["service: UserService", "POST register()", "GET profile", "PATCH verify"]
    },
    
    "Listing": {
        "pos": (1200, 400),
        "size": (160, 120),
        "attrs": ["id: string", "title: string", "rent: number", "status: enum"]
    },
    "ListingService": {
        "pos": (1450, 400),
        "size": (140, 100),
        "attrs": ["create(): Listing", "findAll(): List", "update(): void", "fraud(): number"]
    },
    "ListingController": {
        "pos": (1650, 400),
        "size": (140, 100),
        "attrs": ["service: ListingService", "POST create", "GET all", "PATCH update"]
    },
    
    "Agreement": {
        "pos": (400, 750),
        "size": (160, 120),
        "attrs": ["id: string", "listingId: string", "tenantId: string", "rent: number"]
    },
    "AgreementService": {
        "pos": (650, 750),
        "size": (140, 100),
        "attrs": ["create(): Agreement", "approve(): void", "pdf(): url", "terminate(): void"]
    },
    "AgreementController": {
        "pos": (850, 750),
        "size": (140, 100),
        "attrs": ["service: AgreementService", "POST create", "PATCH approve", "DELETE"]
    },
    
    "Payment": {
        "pos": (1200, 750),
        "size": (160, 120),
        "attrs": ["id: string", "amount: number", "status: enum", "method: PaymentMethod"]
    },
    "PaymentService": {
        "pos": (1450, 750),
        "size": (140, 100),
        "attrs": ["process(): void", "complete(): void", "fail(): void", "history(): List"]
    },
    "PaymentController": {
        "pos": (1650, 750),
        "size": (140, 100),
        "attrs": ["service: PaymentService", "POST process", "PATCH complete", "GET history"]
    },
    
    "Dispute": {
        "pos": (400, 1100),
        "size": (160, 120),
        "attrs": ["id: string", "agreementId: string", "title: string", "status: enum"]
    },
    "DisputeService": {
        "pos": (650, 1100),
        "size": (140, 100),
        "attrs": ["create(): Dispute", "resolve(): void", "escalate(): void", "history(): List"]
    },
    "DisputeController": {
        "pos": (850, 1100),
        "size": (140, 100),
        "attrs": ["service: DisputeService", "POST create", "PATCH resolve", "GET history"]
    },
    
    "Review": {
        "pos": (1200, 1100),
        "size": (160, 120),
        "attrs": ["id: string", "listingId: string", "rating: number", "comment: string"]
    },
    "ReviewService": {
        "pos": (1450, 1100),
        "size": (140, 100),
        "attrs": ["create(): Review", "getByListing(): List", "update(): void", "delete(): void"]
    },
    "ReviewController": {
        "pos": (1650, 1100),
        "size": (140, 100),
        "attrs": ["service: ReviewService", "POST create", "GET listing", "PATCH update"]
    },
    
    "Conversation": {
        "pos": (400, 1450),
        "size": (160, 120),
        "attrs": ["id: string", "participant1Id: string", "participant2Id: string", "listingId: string"]
    },
    "ConversationService": {
        "pos": (650, 1450),
        "size": (140, 100),
        "attrs": ["create(): Conversation", "getAll(): List", "getMessages(): List", "delete(): void"]
    },
    "ConversationController": {
        "pos": (850, 1450),
        "size": (140, 100),
        "attrs": ["service: ConversationService", "POST create", "GET my", "DELETE"]
    },
    
    "Message": {
        "pos": (1200, 1450),
        "size": (160, 120),
        "attrs": ["id: string", "conversationId: string", "senderId: string", "content: string"]
    },
    "MessageService": {
        "pos": (1450, 1450),
        "size": (140, 100),
        "attrs": ["create(): Message", "getByConversation(): List", "markRead(): void", "delete(): void"]
    },
    "MessageController": {
        "pos": (1650, 1450),
        "size": (140, 100),
        "attrs": ["service: MessageService", "POST create", "GET conversation", "PATCH read"]
    },
}

# Draw all classes
for name, data in classes.items():
    draw_class_box(data["pos"][0], data["pos"][1], data["size"][0], data["size"][1], name, data["attrs"])

# ==================== RELATIONSHIPS ====================
# User relationships
draw_relationship(525, 460, 400, 630, "creates", False)
draw_relationship(525, 460, 400, 810, "signs", False)
draw_relationship(525, 460, 1200, 810, "makes", True)
draw_relationship(525, 460, 400, 1160, "files", False)
draw_relationship(525, 460, 1200, 1160, "writes", True)
draw_relationship(525, 460, 400, 1510, "participates", False)

# Listing relationships
draw_relationship(1200, 460, 400, 630, "hasMany", True)

# Agreement relationships
draw_relationship(400, 810, 1200, 810, "requires", False)
draw_relationship(400, 810, 400, 1160, "hasManyDisputes", False)

# Payment relationships
draw_relationship(1200, 810, 400, 1160, "refunds", True)

# Review relationships
draw_relationship(1200, 1160, 1200, 1510, "containsMessages", False)

# Conversation relationships
draw_relationship(400, 1510, 1200, 1510, "contains", False)

# Service relationships (inheritance/uses)
draw_relationship(520, 430, 650, 430, "uses", False)
draw_relationship(745, 430, 850, 430, "calls", False)

draw_relationship(1325, 430, 1450, 430, "uses", False)
draw_relationship(1545, 430, 1650, 430, "calls", False)

draw_relationship(520, 780, 650, 780, "uses", False)
draw_relationship(745, 780, 850, 780, "calls", False)

draw_relationship(1325, 780, 1450, 780, "uses", False)
draw_relationship(1545, 780, 1650, 780, "calls", False)

draw_relationship(520, 1130, 650, 1130, "uses", False)
draw_relationship(745, 1130, 850, 1130, "calls", False)

draw_relationship(1325, 1130, 1450, 1130, "uses", False)
draw_relationship(1545, 1130, 1650, 1130, "calls", False)

draw_relationship(520, 1480, 650, 1480, "uses", False)
draw_relationship(745, 1480, 850, 1480, "calls", False)

draw_relationship(1325, 1480, 1450, 1480, "uses", False)
draw_relationship(1545, 1480, 1650, 1480, "calls", False)

# ==================== LEGEND ====================
legend_y = height - 350

draw.text((200, legend_y), "STRUCTURE:", fill=BLACK, font=box_font)
draw.rectangle([200, legend_y+30, 320, legend_y+70], outline=BLACK, fill=(255,255,255), width=2)
draw.text((260, legend_y+50), "Model", fill=BLACK, font=label_font, anchor="mm")

draw.rectangle([340, legend_y+30, 460, legend_y+70], outline=BLACK, fill=(240,240,240), width=2)
draw.text((400, legend_y+50), "Service", fill=BLACK, font=label_font, anchor="mm")

draw.rectangle([480, legend_y+30, 600, legend_y+70], outline=BLACK, fill=(240,240,240), width=2)
draw.text((540, legend_y+50), "Controller", fill=BLACK, font=label_font, anchor="mm")

draw.text((800, legend_y), "Total Classes: 24 (8 Domains × 3)", fill=DARK_GRAY, font=label_font)

# ==================== FOOTER ====================
draw.text((width-200, height-60), "Class Diagram - Professional Architecture | Black & White", 
          fill=GRAY, font=label_font, anchor="rm")

# ==================== SAVE ====================
img.save('4-class-diagram.png')

try:
    import os
    file_size = os.path.getsize('4-class-diagram.png')
    size_kb = file_size / 1024
except:
    size_kb = 0

print("✅ CLASS DIAGRAM PNG CREATED (ER STYLE)!")
print(f"   📊 File: 4-class-diagram.png")
print(f"   📏 Resolution: {width}x{height} pixels (HD)")
print(f"   💾 Size: {size_kb:.1f} KB")
print(f"   📦 Classes: 24 (8 domains × 3)")
print(f"   🎨 Style: Black & White ER Diagram")
