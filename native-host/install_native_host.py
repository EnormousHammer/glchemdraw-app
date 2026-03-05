#!/usr/bin/env python3
"""
One-click installer for GL-ChemDraw native host.
Bundles the host .exe and installs it (no Python required on user machine).
Run this script; when built with PyInstaller, it extracts and installs the host.
"""
import sys
import os
import json
import shutil
import ctypes

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:
        return False

def main():
    if sys.platform != 'win32':
        print('This installer is for Windows only.')
        input('Press Enter to exit...')
        sys.exit(1)

    # Where to install (user-level, no admin needed)
    install_dir = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'GL-ChemDraw')
    if not install_dir or not os.path.isdir(os.path.dirname(install_dir)):
        install_dir = os.path.join(os.path.expanduser('~'), 'AppData', 'Local', 'GL-ChemDraw')

    os.makedirs(install_dir, exist_ok=True)

    # Find the bundled host exe (when run from PyInstaller)
    if getattr(sys, 'frozen', False):
        bundle_dir = sys._MEIPASS
    else:
        bundle_dir = os.path.dirname(os.path.abspath(__file__))

    host_exe_src = os.path.join(bundle_dir, 'glchemdraw_clipboard.exe')
    host_exe_dst = os.path.join(install_dir, 'glchemdraw_clipboard.exe')

    if not os.path.isfile(host_exe_src):
        print('Error: glchemdraw_clipboard.exe not found in installer.')
        input('Press Enter to exit...')
        sys.exit(1)

    # Copy host exe
    shutil.copy2(host_exe_src, host_exe_dst)

    # Create manifest (escape backslashes for JSON)
    manifest_path = os.path.join(install_dir, 'com.glchemdraw.clipboard.json')
    path_for_json = host_exe_dst.replace('\\', '\\\\')
    manifest = {
        'name': 'com.glchemdraw.clipboard',
        'description': 'GL-ChemDraw clipboard host for FindMolecule paste',
        'path': path_for_json,
        'type': 'stdio',
        'allowed_origins': ['chrome-extension://kaekecncockgnaninbjmcflghibiieke/']
    }
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

    # Register in Chrome native messaging (HKCU = current user, no admin)
    try:
        import winreg
        key_path = r'Software\Google\Chrome\NativeMessagingHosts\com.glchemdraw.clipboard'
        key = winreg.CreateKeyEx(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
        winreg.SetValueEx(key, None, 0, manifest_path)
        winreg.CloseKey(key)
    except Exception as e:
        print(f'Warning: Could not register in registry: {e}')
        print('You may need to run as Administrator.')

    print('')
    print('GL-ChemDraw clipboard host installed successfully!')
    print(f'  Location: {install_dir}')
    print('')
    print('Next step: Add the Chrome extension.')
    print('  1. Go to the setup page and download the extension')
    print('  2. In Chrome: chrome://extensions -> Developer mode -> Load unpacked')
    print('  3. Select the extracted extension folder')
    print('')
    input('Press Enter to close...')

if __name__ == '__main__':
    main()
