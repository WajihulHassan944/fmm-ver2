# Full source package

This delivery contains the complete Fantasy MMadness v59 frontend source and the required `public/` asset directory directly in the project root.

The following generated/reinstallable directories are intentionally not distributed:

- `node_modules/` — restore with `npm install`
- `.next/` — restore with `npm run build`

The duplicated legacy `public/images/mobile-home/app-fixed-v32/` tree and assets with no references anywhere in `src/` were removed. All assets referenced by the application remain in `public/`; there is no nested asset archive to extract.

```bash
npm install
npm run build
npm start
```
