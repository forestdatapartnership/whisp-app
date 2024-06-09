const { spawn } = require('child_process');

const jest = spawn('node', ['--experimental-vm-modules', './node_modules/.bin/jest', ...process.argv.slice(2)], {
  stdio: 'inherit',
});

jest.on('close', (code) => {
  process.exit(code);
});

