import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('[v0] Project root:', projectRoot);
console.log('[v0] DATABASE_URL is set:', !!process.env.DATABASE_URL);

try {
  console.log('[v0] Running drizzle-kit push...');
  execSync('npx drizzle-kit push', {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  console.log('[v0] Database migrations completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('[v0] Migration failed:', error.message);
  process.exit(1);
}
