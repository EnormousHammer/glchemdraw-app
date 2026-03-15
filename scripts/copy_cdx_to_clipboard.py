#!/usr/bin/env python3
"""
Write CDX binary to the Windows clipboard as "ChemDraw Interchange Format".
Used by the NMR proxy to enable FindMolecule paste from the browser.

Reads JSON from stdin: { "cdxml": "<cdxml string>", "mol": "<molfile string>" }.
Converts CDXML → CDX via cdx-mol, then writes to clipboard using pywin32.
ChemDraw-style: CDX in "ChemDraw Interchange Format", MOL in CF_UNICODETEXT (FindMolecule expects MOL).

Requires: pip install cdx-mol pywin32
"""
import sys
import json
import tempfile
import base64
import os


def fix_ketcher_cdxml(cdxml):
    """Ketcher uses charset="utf-8" which pycdxml doesn't recognize. Fix to iso-8859-1."""
    import re
    return re.sub(r'charset="utf-8"', 'charset="iso-8859-1"', cdxml)


def cdxml_to_cdx_bytes(cdxml):
    try:
        from pycdxml import cdxml_converter
    except ImportError:
        try:
            from cdx_mol import cdxml_converter
        except ImportError:
            return None, 'Install cdx-mol: pip install cdx-mol'

    cdxml = fix_ketcher_cdxml(cdxml)
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
        json.dump({'success': False, 'error': 'Windows only'}, sys.stdout)
        return

    try:
        data = json.loads(sys.stdin.read())
    except Exception as e:
        json.dump({'success': False, 'error': f'Bad JSON input: {e}'}, sys.stdout)
        return

    cdxml = (data.get('cdxml') or '').strip()
    mol = (data.get('mol') or '').strip()
    if not cdxml:
        json.dump({'success': False, 'error': 'Missing cdxml'}, sys.stdout)
        return

    cdx_bytes, err = cdxml_to_cdx_bytes(cdxml)
    if cdx_bytes is None:
        json.dump({'success': False, 'error': err or 'CDX conversion failed', 'cdxml_preview': cdxml[:200]}, sys.stdout)
        return

    try:
        import win32clipboard
    except ImportError:
        json.dump({'success': False, 'error': 'Install pywin32: pip install pywin32'}, sys.stdout)
        return

    # ChemDraw puts MOL in CF_UNICODETEXT; FindMolecule expects this for paste. Use MOL if available, else CDXML.
    text_for_clipboard = mol if mol else cdxml

    try:
        fmt_cdx = win32clipboard.RegisterClipboardFormat('ChemDraw Interchange Format')
        win32clipboard.OpenClipboard()
        try:
            win32clipboard.EmptyClipboard()
            win32clipboard.SetClipboardData(fmt_cdx, cdx_bytes)
            win32clipboard.SetClipboardData(win32clipboard.CF_UNICODETEXT, text_for_clipboard)
        finally:
            win32clipboard.CloseClipboard()
        json.dump({'success': True}, sys.stdout)
    except Exception as e:
        json.dump({'success': False, 'error': str(e)}, sys.stdout)


if __name__ == '__main__':
    main()
