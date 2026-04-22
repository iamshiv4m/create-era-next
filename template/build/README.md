# Build resources

Place your app icons here:

- `icon.icns` — macOS (1024×1024, ICNS format)
- `icon.ico` — Windows (multiple resolutions, ICO format)
- `icon.png` — Linux (512×512, PNG)

Generate all three from a single 1024×1024 PNG with tools such as
[`electron-icon-builder`](https://www.npmjs.com/package/electron-icon-builder):

```bash
npx electron-icon-builder --input=./icon.png --output=./build
```

`entitlements.mac.plist` in this folder covers JIT, dyld env vars and network
access needed for a typical Electron renderer. Extend only if your app needs
additional capabilities (e.g. camera, microphone).
