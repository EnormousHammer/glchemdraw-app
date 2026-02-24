#!/usr/bin/env python3
"""
Put a CDX file on Windows clipboard (ChemDraw Interchange Format).
Use after downloading structure.cdx from GL-ChemDraw – then paste into FindMolecule.

Usage: python cdx_to_clipboard.py structure.cdx

Requires: pip install pywin32
Windows only.
"""
import sys
import os

def main():
    if sys.platform != 'win32':
        print('This script is for Windows only.')
        sys.exit(1)

    if len(sys.argv) < 2:
        print('Usage: python cdx_to_clipboard.py <file.cdx>')
        print('  Downloads structure.cdx from GL-ChemDraw, then run this to copy to clipboard.')
        print('  Then paste (Ctrl+V) into FindMolecule.')
        sys.exit(1)

    path = sys.argv[1]
    if not os.path.isfile(path):
        print(f'File not found: {path}')
        sys.exit(1)

    with open(path, 'rb') as f:
        cdx_bytes = f.read()

    if not cdx_bytes:
        print('File is empty')
        sys.exit(1)

    try:
        import win32clipboard  # pip install pywin32
    except ImportError:
        print('Install pywin32: pip install pywin32')
        sys.exit(1)

    fmt = win32clipboard.RegisterClipboardFormat('ChemDraw Interchange Format')
    win32clipboard.OpenClipboard()
    try:
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardData(fmt, cdx_bytes)
        print('CDX copied to clipboard. Paste (Ctrl+V) into FindMolecule.')
    finally:
        win32clipboard.CloseClipboard()

if __name__ == '__main__':
    main()
