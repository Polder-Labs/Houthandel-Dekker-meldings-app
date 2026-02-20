"""
HoutVeilig - Lokale webserver
Start deze server en gebruik cloudflared voor publieke toegang.

Gebruik:
    python server.py
"""

import http.server
import socketserver
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class HoutVeiligHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP handler met juiste MIME types en headers."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    extensions_map = {
        '': 'application/octet-stream',
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.webp': 'image/webp',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.webmanifest': 'application/manifest+json',
    }
    
    def end_headers(self):
        # Voeg headers toe voor PWA en camera functionaliteit
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Cache-Control', 'no-cache')
        # Service Worker scope
        self.send_header('Service-Worker-Allowed', '/')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def main():
    os.chdir(DIRECTORY)
    
    with socketserver.TCPServer(("0.0.0.0", PORT), HoutVeiligHandler) as httpd:
        print(f"""
╔══════════════════════════════════════════════════╗
║     🌲 HoutVeilig Server Gestart                ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Lokaal:  http://localhost:{PORT}                  ║
║  Netwerk: http://0.0.0.0:{PORT}                    ║
║                                                  ║
║  Druk Ctrl+C om te stoppen                       ║
╚══════════════════════════════════════════════════╝
        """)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server gestopt.")
            httpd.shutdown()

if __name__ == '__main__':
    main()
