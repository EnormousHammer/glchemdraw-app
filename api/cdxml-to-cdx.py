"""
Vercel Serverless: CDXML → ChemDraw CDX binary.
For FindMolecule: browser gets CDX file for download (can't put binary on clipboard).
POST with JSON { "cdxml": "..." } → returns CDX bytes.
"""
import json
import base64
import tempfile
import os
from http.server import BaseHTTPRequestHandler


def convert_cdxml_to_cdx(cdxml: str) -> bytes:
    try:
        from pycdxml import cdxml_converter
    except ImportError:
        try:
            from cdx_mol import cdxml_converter
        except ImportError:
            raise RuntimeError("cdx-mol not installed")

    with tempfile.NamedTemporaryFile(mode='w', suffix='.cdxml', delete=False, encoding='utf-8', dir='/tmp') as f:
        f.write(cdxml)
        tmp_path = f.name

    try:
        doc = cdxml_converter.read_cdxml(tmp_path)
        b64 = cdxml_converter.to_b64_cdx(doc)
        return base64.b64decode(b64)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            cdxml = data.get('cdxml') or ''
        except Exception as e:
            self.send_response(400)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': f'Invalid request: {e}'}).encode())
            return

        if not cdxml.strip():
            self.send_response(400)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Missing or empty cdxml'}).encode())
            return

        try:
            cdx_bytes = convert_cdxml_to_cdx(cdxml.strip())
        except Exception as e:
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
            return

        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/octet-stream')
        self.send_header('Content-Disposition', 'attachment; filename="structure.cdx"')
        self.send_header('Content-Length', str(len(cdx_bytes)))
        self.end_headers()
        self.wfile.write(cdx_bytes)
