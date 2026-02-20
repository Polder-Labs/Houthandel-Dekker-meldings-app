"""
Genereer eenvoudige PNG iconen voor de HoutVeilig app.
Gebruikt alleen standaard Python libraries.
"""

import struct
import zlib
import os

def create_png(width, height, color_bg=(46, 125, 50), color_fg=(255, 255, 255)):
    """Maak een eenvoudige PNG met een boom-achtig icoon."""
    
    # Maak pixel data
    pixels = []
    cx, cy = width // 2, height // 2
    
    for y in range(height):
        row = []
        for x in range(width):
            # Afstand van het midden
            dx = x - cx
            dy = y - cy
            
            # Boom driehoek (bovenste deel)
            in_tree = False
            
            # Driehoek 1 (top)
            t1_top = int(height * 0.12)
            t1_bottom = int(height * 0.45)
            if t1_top <= y <= t1_bottom:
                progress = (y - t1_top) / max(1, (t1_bottom - t1_top))
                half_width = int(width * 0.18 * progress)
                if abs(dx) <= half_width:
                    in_tree = True
            
            # Driehoek 2 (midden)
            t2_top = int(height * 0.3)
            t2_bottom = int(height * 0.6)
            if t2_top <= y <= t2_bottom:
                progress = (y - t2_top) / max(1, (t2_bottom - t2_top))
                half_width = int(width * 0.25 * progress)
                if abs(dx) <= half_width:
                    in_tree = True
            
            # Driehoek 3 (onder)
            t3_top = int(height * 0.45)
            t3_bottom = int(height * 0.75)
            if t3_top <= y <= t3_bottom:
                progress = (y - t3_top) / max(1, (t3_bottom - t3_top))
                half_width = int(width * 0.33 * progress)
                if abs(dx) <= half_width:
                    in_tree = True
            
            # Stam
            stam_top = int(height * 0.72)
            stam_bottom = int(height * 0.82)
            stam_width = int(width * 0.06)
            if stam_top <= y <= stam_bottom and abs(dx) <= stam_width:
                in_tree = True
            
            # Waarschuwingsdriehoek (onderaan)
            warn_top = int(height * 0.82)
            warn_bottom = int(height * 0.95)
            warn_cx = cx
            in_warning = False
            if warn_top <= y <= warn_bottom:
                progress = (y - warn_top) / max(1, (warn_bottom - warn_top))
                half_width = int(width * 0.15 * progress)
                if abs(dx) <= half_width:
                    in_warning = True
            
            # Uitroepteken in waarschuwing
            in_excl = False
            excl_top = int(height * 0.85)
            excl_bottom = int(height * 0.92)
            excl_dot_top = int(height * 0.925)
            excl_dot_bottom = int(height * 0.94)
            excl_width = int(width * 0.02)
            if (excl_top <= y <= excl_bottom or excl_dot_top <= y <= excl_dot_bottom) and abs(dx) <= excl_width:
                in_excl = True
            
            # Bepaal kleur
            if in_excl:
                row.extend([255, 255, 255, 255])  # Wit uitroepteken
            elif in_warning:
                row.extend([255, 143, 0, 255])  # Oranje waarschuwing
            elif in_tree:
                row.extend([color_fg[0], color_fg[1], color_fg[2], 255])  # Wit boom
            else:
                # Gradient achtergrond
                t = y / height
                r = int(27 + (76 - 27) * t)   # Van donkergroen naar lichtergroen
                g = int(94 + (175 - 94) * t)
                b = int(32 + (80 - 32) * t)
                row.extend([r, g, b, 255])
        
        pixels.append(bytes([0] + row))  # Filter byte (0 = None) + row data
    
    raw_data = b''.join(pixels)
    
    # PNG structuur bouwen
    def make_chunk(chunk_type, data):
        chunk = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(chunk) & 0xFFFFFFFF)
        return struct.pack('>I', len(data)) + chunk + crc
    
    # PNG signature
    signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)  # 8-bit RGBA
    ihdr = make_chunk(b'IHDR', ihdr_data)
    
    # IDAT chunk (compressed image data)
    compressed = zlib.compress(raw_data, 9)
    idat = make_chunk(b'IDAT', compressed)
    
    # IEND chunk
    iend = make_chunk(b'IEND', b'')
    
    return signature + ihdr + idat + iend

def main():
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    icons_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'icons')
    os.makedirs(icons_dir, exist_ok=True)
    
    for size in sizes:
        filename = os.path.join(icons_dir, f'icon-{size}.png')
        png_data = create_png(size, size)
        with open(filename, 'wb') as f:
            f.write(png_data)
        print(f'  ✓ icon-{size}.png ({len(png_data)} bytes)')
    
    print(f'\nAlle iconen gegenereerd in: {icons_dir}')

if __name__ == '__main__':
    main()
