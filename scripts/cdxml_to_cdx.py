#!/usr/bin/env python3
"""
Convert CDXML to ChemDraw CDX binary format.
Uses pycdxml/cdx-mol (based on official ChemDraw spec) for FindMolecule clipboard compatibility.
Reads CDXML from stdin, writes CDX bytes to stdout.
Requires: pip install cdx-mol  (or clone pycdxml and pip install -e .)
"""
import sys
import tempfile
import base64
import os

def main():
    cdxml = sys.stdin.read()
    if not cdxml.strip():
        sys.stderr.write("Error: No CDXML input\n")
        sys.exit(1)

    try:
        try:
            from pycdxml import cdxml_converter
        except ImportError:
            try:
                from cdx_mol import cdxml_converter
            except ImportError:
                sys.stderr.write(
                    "Error: Install cdx-mol: pip install cdx-mol\n"
                    "Or install pycdxml from https://github.com/kienerj/pycdxml\n"
                )
                sys.exit(1)

        with tempfile.NamedTemporaryFile(mode='w', suffix='.cdxml', delete=False, encoding='utf-8') as f:
            f.write(cdxml)
            tmp_path = f.name

        try:
            doc = cdxml_converter.read_cdxml(tmp_path)
            b64 = cdxml_converter.to_b64_cdx(doc)
            cdx_bytes = base64.b64decode(b64)
            sys.stdout.buffer.write(cdx_bytes)
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    except Exception as e:
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(1)

if __name__ == '__main__':
    main()
