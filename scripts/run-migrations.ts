import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('Running database migrations...');

const child = spawn('npm', ['run', 'db:push'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('Database migrations completed successfully!');
    process.exit(0);
  } else {
    console.error(`Migration failed with code ${code}`);
    process.exit(1);
  }
});
