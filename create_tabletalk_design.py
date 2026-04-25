from PIL import Image, ImageDraw, ImageFont
import os

# Facebook recommended size
width, height = 1200, 630

# Colors
navy_dark = (26, 54, 93)      # #1a365d
navy_mid = (45, 55, 72)       # #2d3748
navy_dark2 = (26, 32, 44)     # #1a202c
amber = (214, 158, 46)        # #d69e2e
off_white = (247, 250, 252)   # #f7fafc
off_white_dim = (200, 210, 220)

# Create image with gradient background
img = Image.new('RGB', (width, height), navy_dark)
draw = ImageDraw.Draw(img)

# Draw gradient background (simple vertical blend)
for y in range(height):
    ratio = y / height
    r = int(navy_dark[0] * (1 - ratio) + navy_dark2[0] * ratio)
    g = int(navy_dark[1] * (1 - ratio) + navy_dark2[1] * ratio)
    b = int(navy_dark[2] * (1 - ratio) + navy_dark2[2] * ratio)
    draw.line([(0, y), (width, y)], fill=(r, g, b))

# Draw subtle amber glow (radial-like effect)
for i in range(100):
    alpha = int(30 * (1 - i/100))
    x = int(width * 0.2)
    y = int(height * 0.8)
    radius = 150 + i * 3
    draw.ellipse([x-radius, y-radius, x+radius, y+radius], 
                 fill=(amber[0], amber[1], amber[2], alpha))

# Accent line at top left
draw.rectangle([60, 60, 140, 64], fill=amber)

# Try to load fonts, fallback to default
try:
    # Try system fonts
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    
    font_title = None
    font_subtitle = None
    font_body = None
    font_small = None
    
    for fp in font_paths:
        if os.path.exists(fp):
            if "Bold" in fp and font_title is None:
                font_title = ImageFont.truetype(fp, 72)
                font_body = ImageFont.truetype(fp, 24)
            elif font_subtitle is None:
                font_subtitle = ImageFont.truetype(fp, 28)
                font_small = ImageFont.truetype(fp, 14)
    
    if font_title is None:
        raise Exception("No fonts found")
        
except:
    font_title = ImageFont.load_default()
    font_subtitle = ImageFont.load_default()
    font_body = ImageFont.load_default()
    font_small = ImageFont.load_default()

# Logo text
draw.text((width - 300, 40), "The Fatherhood Foundation", 
          fill=(180, 190, 200), font=font_small)

# Main headline
draw.text((60, 280), "Table Talk", fill=off_white, font=font_title)
draw.text((60, 360), "for Men", fill=amber, font=font_title)

# Subhead
draw.text((60, 460), "Real conversations. Real brotherhood.", 
          fill=off_white_dim, font=font_subtitle)

# Date block (amber background)
date_x, date_y = 60, 520
date_w, date_h = 220, 60
draw.rectangle([date_x, date_y, date_x + date_w, date_y + date_h], fill=amber)

# Center text in date block
draw.text((date_x + 20, date_y + 15), "THIS SATURDAY", 
          fill=navy_dark2, font=font_body)

# CTA button (border style)
cta_x, cta_y = 320, 520
cta_w, cta_h = 180, 60
draw.rectangle([cta_x, cta_y, cta_x + cta_w, cta_y + cta_h], 
               outline=(200, 210, 220), width=2)
draw.text((cta_x + 30, cta_y + 18), "Join Us →", 
          fill=off_white, font=font_body)

# Save
output_path = "/root/.openclaw/workspace/tabletalk-facebook.png"
img.save(output_path, "PNG", quality=95)
print(f"✅ Saved: {output_path}")

# Also create a version with text only for easy editing
img2 = Image.new('RGB', (width, height), (30, 30, 35))
draw2 = ImageDraw.Draw(img2)

# Draw checkered pattern background
for y in range(0, height, 40):
    for x in range(0, width, 40):
        if (x // 40 + y // 40) % 2 == 0:
            draw2.rectangle([x, y, x+40, y+40], fill=(40, 40, 45))

draw2.text((60, 100), "Table Talk for Men", fill=off_white, font=font_title)
draw2.text((60, 200), "Facebook Post Design", fill=amber, font=font_subtitle)
draw2.text((60, 300), "Size: 1200 x 630 pixels", fill=off_white_dim, font=font_subtitle)
draw2.text((60, 350), "Colors:", fill=off_white, font=font_subtitle)

draw2.rectangle([60, 400, 120, 440], fill=navy_dark)
draw2.text((130, 410), "Navy Dark #1a365d", fill=off_white, font=font_body)

draw2.rectangle([60, 460, 120, 500], fill=amber)
draw2.text((130, 470), "Amber #d69e2e", fill=off_white, font=font_body)

draw2.rectangle([60, 520, 120, 560], fill=off_white)
draw2.text((130, 530), "Off-White #f7fafc", fill=off_white, font=font_body)

spec_path = "/root/.openclaw/workspace/tabletalk-design-spec.png"
img2.save(spec_path, "PNG")
print(f"✅ Saved: {spec_path}")
