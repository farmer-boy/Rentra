#!/usr/bin/env python3
"""
Create a simple use case diagram PNG from scratch using PIL
"""
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
    print("✓ PIL available")
except ImportError:
    print("Installing Pillow...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "-q"])
    from PIL import Image, ImageDraw, ImageFont

# Create image
width, height = 1000, 800
img = Image.new('RGB', (width, height), 'white')
draw = ImageDraw.Draw(img)

# Try to load a font, fall back to default if not available
try:
    title_font = ImageFont.truetype("arial.ttf", 18)
    label_font = ImageFont.truetype("arial.ttf", 12)
    text_font = ImageFont.truetype("arial.ttf", 11)
except:
    title_font = ImageFont.load_default()
    label_font = ImageFont.load_default()
    text_font = ImageFont.load_default()

# Colors
black = (0, 0, 0)
blue = (79, 70, 229)
green = (5, 150, 105)
red = (220, 38, 38)
orange = (180, 83, 9)
light_blue = (224, 231, 255)
light_green = (220, 252, 231)
light_orange = (254, 243, 199)
light_red = (254, 228, 230)

# Title
draw.text((width//2 - 100, 20), "Rentra System - Use Case Diagram", fill=black, font=title_font)

# Main system box
draw.rectangle([250, 60, 950, 760], outline=black, width=2)
draw.text((260, 70), "Rentra System", fill=black, font=label_font)

# Draw actors (stick figures)
actors = [
    (80, 150, "Tenant"),
    (80, 350, "Landlord"),
    (80, 550, "Admin"),
]

for x, y, name in actors:
    # Head
    draw.ellipse([x-12, y, x+12, y+24], outline=black, width=2)
    # Body
    draw.line([(x, y+24), (x, y+58)], fill=black, width=2)
    # Arms
    draw.line([(x, y+38), (x-35, y+20)], fill=black, width=2)
    draw.line([(x, y+38), (x+35, y+20)], fill=black, width=2)
    # Legs
    draw.line([(x, y+58), (x-25, y+88)], fill=black, width=2)
    draw.line([(x, y+58), (x+25, y+88)], fill=black, width=2)
    # Label
    draw.text((x-20, y+100), name, fill=black, font=label_font)

# AI System actor
draw.ellipse([490, 720, 510, 740], outline=black, width=2)
draw.line([(500, 740), (500, 765)], fill=black, width=2)
draw.line([(500, 765), (485, 785)], fill=black, width=2)
draw.line([(500, 765), (515, 785)], fill=black, width=2)
draw.text((480, 790), "AI System", fill=black, font=text_font)

# Use cases (ellipses) - simplified drawing
use_cases = [
    (380, 120, 70, 35, "Search\nProperties", light_blue, blue),
    (520, 170, 70, 35, "Book\nProperty", light_blue, blue),
    (750, 120, 85, 35, "Generate\nDigital Agr", light_orange, orange),
    (380, 240, 70, 35, "Make\nPayment", light_blue, blue),
    (520, 310, 70, 35, "Raise\nDispute", light_blue, blue),
    (750, 240, 85, 35, "Register/\nLogin", light_orange, orange),
    (520, 420, 85, 35, "Approve\nBooking", light_green, green),
    (380, 540, 75, 35, "Add Property\nListing", light_green, green),
    (750, 450, 85, 35, "AI Listing\nVerification", light_orange, orange),
    (520, 600, 70, 35, "Resolve\nDispute", light_red, red),
]

for x, y, rx, ry, text, fill_color, outline_color in use_cases:
    draw.ellipse([x-rx, y-ry, x+rx, y+ry], fill=fill_color, outline=outline_color, width=2)
    draw.text((x-30, y-10), text, fill=black, font=text_font)

# Draw relationships
relationships = [
    (140, 160, 310, 125),  # Tenant -> Search
    (140, 190, 460, 170),  # Tenant -> Book
    (140, 220, 310, 240),  # Tenant -> Payment
    (140, 280, 460, 310),  # Tenant -> Dispute
    (140, 380, 460, 420),  # Landlord -> Approve
    (140, 420, 310, 540),  # Landlord -> Add
    (140, 580, 460, 600),  # Admin -> Resolve
    (520, 730, 720, 485),  # AI -> Verification
]

for x1, y1, x2, y2 in relationships:
    draw.line([(x1, y1), (x2, y2)], fill=black, width=2)
    # Simple arrowhead
    if x2 > x1:
        draw.polygon([(x2, y2), (x2-8, y2-3), (x2-8, y2+3)], fill=black)
    else:
        draw.polygon([(x2, y2), (x2+8, y2-3), (x2+8, y2+3)], fill=black)

# Save the image
output_path = "use-case-simple.png"
img.save(output_path, 'PNG')
print(f"✓ Created {output_path}")

import os
size = os.path.getsize(output_path)
print(f"✓ File size: {size} bytes")
