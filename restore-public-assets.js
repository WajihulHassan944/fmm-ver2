const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = __dirname;
const archivePath = path.join(projectRoot, 'public-assets.tar.gz');
const publicPath = path.join(projectRoot, 'public');

if (!fs.existsSync(archivePath) || fs.existsSync(publicPath)) {
  process.exit(0);
}

const result = spawnSync('tar', ['-xzf', archivePath, '-C', projectRoot], {
  stdio: 'inherit',
});

if (result.status !== 0) {
  console.error('Unable to restore the public asset bundle. Install tar and rerun npm install.');
  process.exit(result.status || 1);
}

console.log('Restored public/ from public-assets.tar.gz');
