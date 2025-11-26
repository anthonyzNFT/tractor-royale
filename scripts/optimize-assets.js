import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../packages/game-client/public/assets');

console.log('🔧 Optimizing assets...');

function getDirectorySize(dirPath) {
  let size = 0;
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  });
  
  return size;
}

if (fs.existsSync(ASSETS_DIR)) {
  const totalSize = getDirectorySize(ASSETS_DIR);
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`📦 Total assets size: ${sizeMB} MB`);
  
  if (totalSize > 2 * 1024 * 1024) {
    console.warn('⚠️  Warning: Assets exceed 2MB target!');
    console.log('Consider:');
    console.log('  - Using Draco compression for 3D models');
    console.log('  - Compressing textures with tools like TinyPNG');
    console.log('  - Creating texture atlases');
    console.log('  - Lazy-loading non-critical assets');
  } else {
    console.log('✅ Assets within 2MB budget!');
  }
} else {
  console.log('📁 Assets directory not found. Creating...');
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.mkdirSync(path.join(ASSETS_DIR, 'models'), { recursive: true });
  fs.mkdirSync(path.join(ASSETS_DIR, 'textures'), { recursive: true });
  fs.mkdirSync(path.join(ASSETS_DIR, 'audio'), { recursive: true });
  fs.mkdirSync(path.join(ASSETS_DIR, 'shaders'), { recursive: true });
  console.log('✅ Asset directories created!');
}

console.log('✨ Asset optimization complete!');
