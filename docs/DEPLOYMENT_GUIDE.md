# GlChemDraw - Administrator Deployment Guide

## Enterprise Deployment Overview

This guide is for IT administrators deploying GlChemDraw in enterprise environments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [Silent Installation](#silent-installation)
4. [Group Policy Deployment](#group-policy-deployment)
5. [Configuration Management](#configuration-management)
6. [Network Requirements](#network-requirements)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **OS**: Windows 10 (1809+) or Windows 11
- **Architecture**: x64 only
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 500MB installation + 100MB app data
- **WebView2 Runtime**: Installed automatically if missing

### Administrator Rights
- Local Administrator required for installation
- Standard users can run after installation
- Per-machine install recommended for enterprise

## Installation Methods

### Method 1: MSI Installer (Recommended)
**File**: `GlChemDraw-{version}-x64.msi`

**Features:**
- Windows Installer technology
- Group Policy deployment support
- Centralized uninstall
- Repair functionality
- Logging built-in

**Installation:**
```powershell
msiexec /i GlChemDraw-0.1.0-x64.msi /qn /l*v install.log
```

### Method 2: NSIS Installer
**File**: `GlChemDraw-{version}-x64-setup.exe`

**Features:**
- Smaller file size
- Faster installation
- Custom branding options
- Progress visualization

**Silent Installation:**
```powershell
GlChemDraw-0.1.0-x64-setup.exe /S
```

## Silent Installation

### MSI Silent Install
```powershell
# Basic silent install
msiexec /i GlChemDraw-0.1.0-x64.msi /qn

# With logging
msiexec /i GlChemDraw-0.1.0-x64.msi /qn /l*v "C:\Logs\GlChemDraw-install.log"

# Custom install directory
msiexec /i GlChemDraw-0.1.0-x64.msi /qn INSTALLDIR="C:\Program Files\GlChemDraw"

# Suppress restart
msiexec /i GlChemDraw-0.1.0-x64.msi /qn /norestart
```

### NSIS Silent Install
```powershell
# Silent install
GlChemDraw-0.1.0-x64-setup.exe /S

# Custom directory
GlChemDraw-0.1.0-x64-setup.exe /S /D=C:\Program Files\GlChemDraw
```

### Verification
```powershell
# Check if installed
Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* |
  Where-Object { $_.DisplayName -like "*GlChemDraw*" }

# Check application exists
Test-Path "C:\Program Files\GlChemDraw\GlChemDraw.exe"
```

## Group Policy Deployment

### 1. Prepare MSI Package
1. Copy `GlChemDraw-0.1.0-x64.msi` to network share
2. Set permissions (Domain Computers: Read)
3. Example: `\\fileserver\software\GlChemDraw\GlChemDraw-0.1.0-x64.msi`

### 2. Create GPO
1. Open **Group Policy Management Console**
2. Create new GPO: "Deploy GlChemDraw"
3. Link to appropriate OU

### 3. Configure Software Installation
1. Edit GPO
2. Navigate to: **Computer Configuration → Policies → Software Settings → Software Installation**
3. Right-click → **New → Package**
4. Browse to network path: `\\fileserver\software\GlChemDraw\GlChemDraw-0.1.0-x64.msi`
5. Select **Assigned**

### 4. Deployment Options
**Properties → Deployment:**
- ☑ **Uninstall this application when it falls out of the scope of management**
- ☑ **Install this application at logon**
- Deployment type: **Assigned**
- Installation UI: **Basic** (or **Maximum** for interactive)

### 5. Apply and Test
1. Apply GPO to test OU
2. Run `gpupdate /force` on test machine
3. Reboot or re-logon
4. Verify installation

## Configuration Management

### Registry Settings
**Location**: `HKEY_LOCAL_MACHINE\SOFTWARE\GlChemTec\GlChemDraw`

**Available Settings:**
```registry
[HKEY_LOCAL_MACHINE\SOFTWARE\GlChemTec\GlChemDraw]
"UpdateCheck"=dword:00000001        ; Enable auto-update checks
"PubChemEnabled"=dword:00000001     ; Enable PubChem integration
"OfflineMode"=dword:00000000        ; Force offline mode
"CacheExpiry"=dword:00000007        ; Cache expiration (days)
"MaxFileSize"=dword:0000000a        ; Max file size (MB)
```

### App Data Location
**Per-User**: `%APPDATA%\com.glchemtec.glchemdraw\`
**Local App Data**: `%LOCALAPPDATA%\com.glchemtec.glchemdraw\`

**Contains:**
- `config.json` - User preferences
- `cache/` - PubChem cache (IndexedDB)
- `logs/` - Application logs
- `recent_files.json` - Recent files list

### Pre-configure Settings
Deploy `config.json` to app data directory:
```json
{
  "darkMode": false,
  "autoUpdate": true,
  "pubchemEnabled": true,
  "offlineMode": false,
  "cacheExpiry": 7,
  "maxFileSize": 10
}
```

## Network Requirements

### Firewall Rules
**Outbound HTTPS (443):**
- `pubchem.ncbi.nlm.nih.gov` - PubChem API
- `cdn.playwright.dev` - (Dev/Test only)
- `your-update-server.com` - Auto-update server

**Whitelist Domains:**
```
pubchem.ncbi.nlm.nih.gov
eutils.ncbi.nlm.nih.gov
cdn.playwright.dev (optional)
```

### Proxy Configuration
GlChemDraw respects system proxy settings automatically.

**Manual Proxy (if needed):**
```powershell
netsh winhttp set proxy proxy-server="proxy.company.com:8080"
```

### Air-gapped Environments
**Offline Mode:**
1. Set registry: `"OfflineMode"=dword:00000001`
2. Disable PubChem: `"PubChemEnabled"=dword:00000000`
3. Application functions without internet
4. Pre-populate cache if possible

## Updates and Maintenance

### Auto-Update System
**Enabled by default**

**Disable Auto-Update:**
```registry
[HKEY_LOCAL_MACHINE\SOFTWARE\GlChemTec\GlChemDraw]
"AutoUpdate"=dword:00000000
```

### Manual Updates
1. Download new MSI
2. Run silent install (will upgrade)
3. No uninstall needed

```powershell
msiexec /i GlChemDraw-0.2.0-x64.msi /qn /l*v upgrade.log
```

### Update Server (Enterprise)
Host your own update server:
1. Edit `tauri.conf.json` → `updater.endpoints`
2. Point to internal server
3. Sign updates with private key
4. Distribute public key with installer

## Uninstallation

### MSI Uninstall
```powershell
# Find product code
$app = Get-WmiObject -Class Win32_Product | Where-Object { $_.Name -eq "GlChemDraw" }

# Uninstall
msiexec /x $app.IdentifyingNumber /qn /l*v uninstall.log

# Or by path
msiexec /x GlChemDraw-0.1.0-x64.msi /qn
```

### NSIS Uninstall
```powershell
# Run uninstaller
"C:\Program Files\GlChemDraw\uninstall.exe" /S
```

### Clean User Data (Optional)
```powershell
Remove-Item "$env:APPDATA\com.glchemtec.glchemdraw" -Recurse -Force
Remove-Item "$env:LOCALAPPDATA\com.glchemtec.glchemdraw" -Recurse -Force
```

## Troubleshooting

### Installation Fails
**Check Logs:**
```powershell
# MSI log location
Get-Content "C:\Windows\Temp\MSI*.log" | Select-String -Pattern "error"

# Event Viewer
Get-EventLog -LogName Application -Source MsiInstaller -Newest 10
```

**Common Issues:**
- WebView2 installation failure → Install manually
- Insufficient permissions → Run as Administrator
- Conflicting version → Uninstall old version first
- Corrupted MSI → Re-download installer

### Application Won't Start
```powershell
# Check if process starts
Get-Process | Where-Object { $_.Name -like "*GlChemDraw*" }

# Check Windows Event Log
Get-WinEvent -LogName Application -MaxEvents 50 |
  Where-Object { $_.ProviderName -eq "GlChemDraw" }
```

### GPO Deployment Issues
1. Verify MSI on network share is accessible
2. Check GPO applied: `gpresult /r`
3. Force GPO update: `gpupdate /force`
4. Check Application Event Log on client
5. Enable verbose MSI logging:
   ```registry
   [HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Windows\Installer]
   "Logging"="voicewarmup"
   ```

## Security Considerations

### Code Signing
- All executables are code-signed
- Verify signature before deployment:
  ```powershell
  Get-AuthenticodeSignature "GlChemDraw.exe"
  ```

### SmartScreen
- Signed apps bypass SmartScreen
- If unsigned, users will see warning
- Enterprise CA certificates may require approval

### Antivirus Exclusions
If false positives occur:
```
C:\Program Files\GlChemDraw\
%APPDATA%\com.glchemtec.glchemdraw\
```

---

## Support

**Enterprise Support**: enterprise@glchemtec.com  
**Documentation**: https://docs.glchemtec.com/deployment  
**Issue Tracking**: https://github.com/glchemtec/glchemdraw/issues  

**Version**: 0.1.0  
**Last Updated**: January 2025

