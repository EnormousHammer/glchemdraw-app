# GL-ChemDraw Desktop App Build

## Icons (GLC Logo)

Icons are generated from `public/GLC_icon.png`. To regenerate:

```bash
npm run tauri:icons
```

Or before building:

```bash
npm run prebuild:tauri
```

## Build Desktop App

```bash
npm run tauri:build
```

This will:
1. Create a square 512×512 icon from `GLC_icon.png`
2. Regenerate all platform icons (ico, icns, png, etc.)
3. Run `npm run build` (web build)
4. Build the Tauri desktop app
5. Create installers in `src-tauri/target/release/bundle/`

## Output Locations

| Platform | Path |
|----------|------|
| Windows MSI | `src-tauri/target/release/bundle/msi/` |
| Windows NSIS | `src-tauri/target/release/bundle/nsis/` |
| macOS DMG | `src-tauri/target/release/bundle/dmg/` |
| Linux AppImage | `src-tauri/target/release/bundle/appimage/` |

## Tauri Version Note

If you see "version mismatched Tauri packages", ensure Rust crates (Cargo.toml) and npm packages (package.json) use the same major.minor:
- `tauri` (Rust) ↔ `@tauri-apps/api` (npm)
- `tauri-plugin-dialog` (Rust) ↔ `@tauri-apps/plugin-dialog` (npm)

Run `cargo update` and `npm install` after changing versions.
