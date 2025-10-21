# Code Signing Configuration

## Overview
GlChemDraw is configured for code signing on Windows, macOS, and Linux platforms to ensure application integrity and user trust.

## Windows Code Signing

### Configuration
- **Certificate Thumbprint**: Set in `tauri.conf.json` under `bundle.windows.certificateThumbprint`
- **Digest Algorithm**: SHA-256 (recommended for security)
- **Timestamp URL**: DigiCert timestamp server for long-term validity

### Setup Instructions

1. **Obtain Code Signing Certificate**:
   - Purchase from trusted CA (DigiCert, Sectigo, etc.)
   - Install certificate in Windows Certificate Store
   - Note the certificate thumbprint

2. **Update Configuration**:
   ```json
   "windows": {
     "certificateThumbprint": "YOUR_CERTIFICATE_THUMBPRINT",
     "digestAlgorithm": "sha256",
     "timestampUrl": "http://timestamp.digicert.com"
   }
   ```

3. **Build Signed Application**:
   ```bash
   npm run tauri build
   ```

### Certificate Management
- Store certificate securely
- Use hardware security modules (HSM) for production
- Implement certificate renewal process
- Monitor certificate expiration

## macOS Code Signing

### Configuration
- **Signing Identity**: Apple Developer ID
- **Entitlements**: App-specific permissions
- **Notarization**: Required for distribution outside App Store

### Setup Instructions

1. **Apple Developer Account**:
   - Enroll in Apple Developer Program
   - Create Developer ID Application certificate
   - Download and install certificate

2. **Update Configuration**:
   ```json
   "macOS": {
     "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
     "entitlements": "entitlements.plist",
     "providerShortName": "YOUR_PROVIDER_SHORT_NAME"
   }
   ```

3. **Create Entitlements File**:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
     <key>com.apple.security.cs.allow-jit</key>
     <true/>
     <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
     <true/>
     <key>com.apple.security.cs.disable-executable-page-protection</key>
     <true/>
   </dict>
   </plist>
   ```

4. **Build and Notarize**:
   ```bash
   npm run tauri build
   xcrun notarytool submit GlChemDraw.app --keychain-profile "notarytool-profile"
   ```

## Linux Code Signing

### Configuration
- **GPG Signing**: For package integrity
- **Repository Signing**: For update distribution
- **Package Verification**: Using package managers

### Setup Instructions

1. **Generate GPG Key**:
   ```bash
   gpg --full-generate-key
   ```

2. **Sign Packages**:
   ```bash
   gpg --armor --detach-sign GlChemDraw.deb
   ```

3. **Verify Signatures**:
   ```bash
   gpg --verify GlChemDraw.deb.asc
   ```

## CI/CD Integration

### GitHub Actions
```yaml
name: Build and Sign
on:
  push:
    tags: ['v*']

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Tauri CLI
        run: npm install -g @tauri-apps/cli
      - name: Install Dependencies
        run: npm install
      - name: Build Application
        run: npm run tauri build
        env:
          CERTIFICATE_THUMBPRINT: ${{ secrets.CERTIFICATE_THUMBPRINT }}
```

### Environment Variables
- `CERTIFICATE_THUMBPRINT`: Windows certificate thumbprint
- `APPLE_SIGNING_IDENTITY`: macOS signing identity
- `APPLE_PROVIDER_SHORT_NAME`: macOS provider short name
- `GPG_PRIVATE_KEY`: Linux GPG private key

## Security Best Practices

### Certificate Security
1. **Hardware Security Modules**: Use HSM for production certificates
2. **Certificate Rotation**: Implement regular certificate renewal
3. **Access Control**: Limit certificate access to authorized personnel
4. **Audit Logging**: Log all signing operations

### Build Security
1. **Secure Build Environment**: Use isolated, clean build systems
2. **Dependency Verification**: Verify all dependencies before signing
3. **Code Review**: Review all code before signing
4. **Automated Testing**: Run comprehensive tests before signing

### Distribution Security
1. **Secure Distribution**: Use HTTPS for all downloads
2. **Checksum Verification**: Provide checksums for verification
3. **Update Security**: Sign all updates and patches
4. **Revocation Process**: Implement certificate revocation process

## Troubleshooting

### Common Issues
- **Certificate Not Found**: Verify certificate installation and thumbprint
- **Timestamp Server Issues**: Check timestamp server availability
- **Entitlements Errors**: Verify entitlements file format
- **Notarization Failures**: Check Apple Developer account status

### Debug Commands
```bash
# Windows - Check certificate
certlm.msc

# macOS - Check signing identity
security find-identity -v -p codesigning

# Linux - Check GPG key
gpg --list-secret-keys --keyid-format LONG
```

## Compliance

### Standards
- **FIPS 140-2**: For government and enterprise use
- **Common Criteria**: For high-security environments
- **SOC 2**: For cloud-based distribution

### Documentation
- Maintain certificate inventory
- Document signing procedures
- Track certificate expiration
- Implement incident response plan
