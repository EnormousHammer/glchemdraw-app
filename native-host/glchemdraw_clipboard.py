#!/usr/bin/env python3
"""
Chrome Native Messaging Host for GL-ChemDraw.
Receives CDX (base64) from the extension and puts it on the Windows clipboard
in "ChemDraw Interchange Format" for pasting into FindMolecule ELN.

Chrome protocol: 4-byte length (native) + UTF-8 JSON on stdin;
4-byte length + UTF-8 JSON on stdout.
"""
import sys
import struct
import json
import base64

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
        cdx_b64 = data.get('cdx') or data.get('cdxBase64') or ''
        if not cdx_b64:
            write_message({'success': False, 'error': 'Missing cdx field'})
            return
        cdx_bytes = base64.b64decode(cdx_b64)
        if not cdx_bytes:
            write_message({'success': False, 'error': 'Invalid base64'})
            return
    except Exception as e:
        write_message({'success': False, 'error': str(e)})
        return

    try:
        import win32clipboard
    except ImportError:
        write_message({'success': False, 'error': 'Install pywin32: pip install pywin32'})
        return

    try:
        fmt = win32clipboard.RegisterClipboardFormat('ChemDraw Interchange Format')
        win32clipboard.OpenClipboard()
        try:
            win32clipboard.EmptyClipboard()
            win32clipboard.SetClipboardData(fmt, cdx_bytes)
            write_message({'success': True})
        finally:
            win32clipboard.CloseClipboard()
    except Exception as e:
        write_message({'success': False, 'error': str(e)})

if __name__ == '__main__':
    main()
