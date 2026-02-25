#!/usr/bin/env python3
"""
Chrome Native Messaging Host for GL-ChemDraw.
Receives CDXML (required) and optional Ketcher CDX (base64) from the extension.
Puts on Windows clipboard (ChemDraw-style):
  - CDX in "ChemDraw Interchange Format" (for ClipboardWin) – uses cdx-mol for ChemDraw compatibility
  - CDXML as text/plain (browser paste fallback)

Priority: CDXML → cdx-mol conversion (ChemDraw-spec CDX) > Ketcher CDX fallback.
Requires: pip install pywin32, pip install cdx-mol (for best FindMolecule compatibility)
"""
import sys
import struct
import json
import base64
import tempfile
import os

def read_message():
    raw_len = sys.stdin.buffer.read(4)
    if len(raw_len) < 4:
        return None
    msg_len = struct.unpack('=I', raw_len)[0]
    return sys.stdin.buffer.read(msg_len).decode('utf-8')

def write_message(obj):
    msg = json.dumps(obj).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('=I', len(msg)))
    sys.stdout.buffer.write(msg)
    sys.stdout.buffer.flush()

def cdxml_to_cdx_bytes(cdxml):
    """Convert CDXML to ChemDraw CDX using cdx-mol (ChemDraw-spec compatible)."""
    try:
        try:
            from pycdxml import cdxml_converter
        except ImportError:
            try:
                from cdx_mol import cdxml_converter
            except ImportError:
                return None, 'Install cdx-mol: pip install cdx-mol'
    except Exception as e:
        return None, str(e)
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.cdxml', delete=False, encoding='utf-8') as f:
            f.write(cdxml)
            tmp_path = f.name
        doc = cdxml_converter.read_cdxml(tmp_path)
        b64 = cdxml_converter.to_b64_cdx(doc)
        return base64.b64decode(b64), None
    except Exception as e:
        return None, str(e)
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

def main():
    if sys.platform != 'win32':
        write_message({'success': False, 'error': 'Windows only'})
        return

    try:
        raw = read_message()
        if not raw:
            write_message({'success': False, 'error': 'No input'})
            return
        data = json.loads(raw)
        cdxml = (data.get('cdxml') or '').strip()
        cdx_b64 = data.get('cdx') or data.get('cdxBase64') or ''
        if not cdxml and not cdx_b64:
            write_message({'success': False, 'error': 'Missing cdxml or cdx field'})
            return
    except Exception as e:
        write_message({'success': False, 'error': str(e)})
        return

    try:
        import win32clipboard
    except ImportError:
        write_message({'success': False, 'error': 'Install pywin32: pip install pywin32'})
        return

    cdx_bytes = None
    # 1. Prefer CDXML → cdx-mol conversion (ChemDraw-spec, ClipboardWin compatible)
    if cdxml:
        cdx_bytes, err = cdxml_to_cdx_bytes(cdxml)
        if cdx_bytes is None and err:
            pass  # fall back to Ketcher CDX
    # 2. Fallback: Ketcher CDX (may have compatibility issues)
    if cdx_bytes is None and cdx_b64:
        try:
            cdx_bytes = base64.b64decode(cdx_b64)
        except Exception:
            pass
    if cdx_bytes is None:
        write_message({
            'success': False,
            'error': 'Could not get CDX. Install cdx-mol: pip install cdx-mol'
        })
        return

    try:
        fmt_cdx = win32clipboard.RegisterClipboardFormat('ChemDraw Interchange Format')
        win32clipboard.OpenClipboard()
        try:
            win32clipboard.EmptyClipboard()
            win32clipboard.SetClipboardData(fmt_cdx, cdx_bytes)
            if cdxml:
                win32clipboard.SetClipboardData(win32clipboard.CF_UNICODETEXT, cdxml)
            write_message({'success': True})
        finally:
            win32clipboard.CloseClipboard()
    except Exception as e:
        write_message({'success': False, 'error': str(e)})

if __name__ == '__main__':
    main()
