#!/usr/bin/env python3
"""
Class Diagram - HD Quality PNG
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
    class_font = ImageFont.truetype("arial.ttf", 32)
    box_font = ImageFont.truetype("arial.ttf", 14)
    label_font = ImageFont.truetype("arial.ttf", 12)
    method_font = ImageFont.truetype("arial.ttf", 10)
except:
    header_font = class_font = box_font = label_font = method_font = ImageFont.load_default()

# Colors
BLACK = (0, 0, 0)
DARK_GRAY = (60, 60, 60)
GRAY = (120, 120, 120)
LIGHT_GRAY = (220, 220, 220)
MODEL_COLOR = (200, 220, 255)
SERVICE_COLOR = (220, 255, 200)
CONTROLLER_COLOR = (255, 240, 200)

def draw_class_box(x, y, width_box, height_box, class_name, properties, methods, color):
    """Draw UML class box with properties and methods"""
    # Draw box
    draw.rectangle([x-width_box//2, y-height_box//2, x+width_box//2, y+height_box//2],
                   fill=color, outline=BLACK, width=2)
    
    # Class name (bold effect)
    draw.text((x, y-height_box//2+15), class_name, fill=BLACK, font=box_font, anchor="mm", align="center")
    
    # Divider line
    divider_y = y-height_box//2+35
    draw.line([(x-width_box//2+5, divider_y), (x+width_box//2-5, divider_y)], fill=GRAY, width=1)
    
    # Properties
    for i, prop in enumerate(properties[:3]):
        prop_y = y - 20 + i*15
        draw.text((x-width_box//2+10, prop_y), prop, fill=DARK_GRAY, font=method_font, anchor="lm")
    
    # Methods divider
    methods_divider_y = y + 35
    draw.line([(x-width_box//2+5, methods_divider_y), (x+width_box//2-5, methods_divider_y)], fill=GRAY, width=1)
    
    # Methods
    for i, method in enumerate(methods[:2]):
        method_y = y + 50 + i*12
        draw.text((x-width_box//2+10, method_y), method, fill=DARK_GRAY, font=method_font, anchor="lm")

def draw_arrow(x1, y1, x2, y2):
    """Draw arrow between classes"""
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
draw.text((width//2, 60), "RENTRA CLASS DIAGRAM", fill=BLACK, font=header_font, anchor="mm")
draw.text((width//2, 125), "8 Core Classes × 3 Components = 24 Core Boxes", 
          fill=GRAY, font=class_font, anchor="mm")

# ==================== CLASSES & COMPONENTS ====================
classes = [
    ("User Management", [
        ("User", ["-id, -email, -cnic", "-fullName, -role", "-trustScore"], ["+register()", "+login()"]),
        ("UserService", ["-prisma: PrismaService", "-config: ConfigService", "-hash: bcrypt"], ["+create()", "+findById()"]),
        ("UserController", ["-userService: UserService", "-auth: AuthGuard", "-roles: RolesGuard"], ["+POST register()", "+GET profile()"])
    ]),
    ("Listing Management", [
        ("Listing", ["-id, -title, -address", "-rent, -deposit, -status", "-fraudScore"], ["+createListing()", "+updateListing()"]),
        ("ListingService", ["-prisma: PrismaService", "-fraud: FraudService", "-storage: S3"], ["+create()", "+getAll()"]),
        ("ListingController", ["-listingService: ListingService", "-auth: AuthGuard", "-validation: Pipe"], ["+POST create()", "+GET findAll()"])
    ]),
    ("Agreement Management", [
        ("Agreement", ["-id, -listingId, -tenantId", "-rent, -deposit, -status", "-pdfUrl"], ["+createAgreement()", "+generatePDF()"]),
        ("AgreementService", ["-prisma: PrismaService", "-pdf: PdfService", "-email: EmailService"], ["+create()", "+approve()"]),
        ("AgreementController", ["-agreementService: AgreementService", "-auth: AuthGuard", "-document: Pipe"], ["+POST create()", "+PATCH approve()"])
    ]),
    ("Payment Processing", [
        ("Payment", ["-id, -agreementId, -tenantId", "-amount, -method, -status", "-transactionId"], ["+processPayment()", "+generateReceipt()"]),
        ("PaymentService", ["-prisma: PrismaService", "-gateway: PaymentGateway", "-transaction: TxnManager"], ["+create()", "+complete()"]),
        ("PaymentController", ["-paymentService: PaymentService", "-auth: AuthGuard", "-webhook: Webhook"], ["+POST create()", "+PATCH complete()"])
    ]),
    ("Dispute Resolution", [
        ("Dispute", ["-id, -agreementId, -tenantId", "-title, -description, -amount", "-status, -resolution"], ["+fileDispute()", "+resolveDispute()"]),
        ("DisputeService", ["-prisma: PrismaService", "-arbitration: ArbService", "-notify: NotifyService"], ["+create()", "+resolve()"]),
        ("DisputeController", ["-disputeService: DisputeService", "-auth: AuthGuard", "-admin: AdminGuard"], ["+POST create()", "+PATCH resolve()"])
    ]),
    ("Review & Rating", [
        ("Review", ["-id, -listingId, -userId", "-rating 1-5, -comment", "-createdAt"], ["+createReview()", "+updateRating()"]),
        ("ReviewService", ["-prisma: PrismaService", "-cache: CacheService", "-analytics: Analytics"], ["+create()", "+getByListing()"]),
        ("ReviewController", ["-reviewService: ReviewService", "-auth: AuthGuard", "-validation: Pipe"], ["+POST create()", "+GET findAll()"])
    ]),
    ("Messaging System", [
        ("Message", ["-id, -conversationId, -senderId", "-content, -isRead, -readAt", "-attachmentUrl"], ["+sendMessage()", "+markAsRead()"]),
        ("MessageService", ["-prisma: PrismaService", "-socket: SocketService", "-encryption: CryptoService"], ["+create()", "+markRead()"]),
        ("MessageController", ["-messageService: MessageService", "-auth: AuthGuard", "-socket: SocketGateway"], ["+POST create()", "+PATCH markRead()"])
    ]),
    ("Conversation Tracking", [
        ("Conversation", ["-id, -participant1Id, -participant2Id", "-listingId, -agreementId", "-lastMessageAt"], ["+createConversation()", "+getMessages()"]),
        ("ConversationService", ["-prisma: PrismaService", "-socket: SocketService", "-cache: CacheService"], ["+create()", "+getAll()"]),
        ("ConversationController", ["-conversationService: ConversationService", "-auth: AuthGuard", "-socket: SocketGateway"], ["+POST create()", "+GET findAll()"])
    ]),
]

box_width = 200
box_height = 140
row_height = 480
col_width = 900
start_x = 200
start_y = 300

# Draw classes in grid
row = 0
col = 0

for domain_name, components in classes:
    # Domain title
    domain_x = start_x + col * col_width
    domain_y = start_y + row * row_height - 140
    
    draw.text((domain_x + 220, domain_y), domain_name, fill=DARK_GRAY, font=class_font, anchor="mm")
    
    # Draw 3 boxes for each domain
    y_base = start_y + row * row_height
    
    # Model box
    model_x = domain_x + 50
    model_class, model_props, model_methods = components[0]
    draw_class_box(model_x, y_base, box_width, box_height, model_class, model_props, model_methods, MODEL_COLOR)
    
    # Service box
    service_x = domain_x + 240
    service_class, service_props, service_methods = components[1]
    draw_class_box(service_x, y_base, box_width, box_height, service_class, service_props, service_methods, SERVICE_COLOR)
    
    # Controller box
    controller_x = domain_x + 430
    controller_class, controller_props, controller_methods = components[2]
    draw_class_box(controller_x, y_base, box_width, box_height, controller_class, controller_props, controller_methods, CONTROLLER_COLOR)
    
    # Draw arrows between boxes
    draw_arrow(model_x + 110, y_base, service_x - 110, y_base)
    draw_arrow(service_x + 110, y_base, controller_x - 110, y_base)
    
    # Move to next position
    col += 1
    if col >= 2:
        col = 0
        row += 1

# ==================== LEGEND ====================
legend_y = height - 250

draw.text((200, legend_y), "LEGEND:", fill=BLACK, font=box_font)
draw.rectangle([200, legend_y+30, 280, legend_y+60], fill=MODEL_COLOR, outline=BLACK, width=2)
draw.text((300, legend_y+45), "Model/Entity Class", fill=BLACK, font=label_font, anchor="lm")

draw.rectangle([200, legend_y+80, 280, legend_y+110], fill=SERVICE_COLOR, outline=BLACK, width=2)
draw.text((300, legend_y+95), "Service Class", fill=BLACK, font=label_font, anchor="lm")

draw.rectangle([200, legend_y+130, 280, legend_y+160], fill=CONTROLLER_COLOR, outline=BLACK, width=2)
draw.text((300, legend_y+145), "Controller Class", fill=BLACK, font=label_font, anchor="lm")

draw.text((1300, legend_y), "Total Classes: 24 (8 domains × 3 classes)", 
          fill=DARK_GRAY, font=label_font)

# ==================== FOOTER ====================
draw.text((width-200, height-60), "Class Diagram Architecture | HD Quality", 
          fill=GRAY, font=label_font, anchor="rm")

# ==================== SAVE ====================
img.save('4-class-diagram.png')

try:
    import os
    file_size = os.path.getsize('4-class-diagram.png')
    size_kb = file_size / 1024
except:
    size_kb = 0

print("✅ CLASS DIAGRAM PNG CREATED!")
print(f"   📊 File: 4-class-diagram.png")
print(f"   📏 Resolution: {width}x{height} pixels (HD)")
print(f"   💾 Size: {size_kb:.1f} KB")
print(f"   📦 Classes: 24 (8 domains × 3 classes)")
