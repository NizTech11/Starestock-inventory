import { spawn } from 'child_process';

function runProcess(name, cmd, args) {
  const proc = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true
  });
  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return proc;
}

console.log('Starting Shop3 Inventory Backend (Port 3001) + Vite Frontend (Port 5173)...');
const apiProc = runProcess('api', 'node', ['server/index.js']);
const webProc = runProcess('web', 'npx', ['vite']);

process.on('SIGINT', () => {
  apiProc.kill();
  webProc.kill();
  process.exit(0);
});

