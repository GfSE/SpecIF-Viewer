// Usage: execute `$ npm run start` inside your shell.

const util = require('util');
const exec = util.promisify(
  require('child_process').exec
);

/**
 * @param {string} command
 */
async function executeCommand(command) {
  console.info(`Executing command: ${command}`);

  try {
    const { stdout, stderr } = await exec(command);
    stderr ? console.error(`Command stderr: ${stderr}`) : console.log(`Command stdout: ${stdout}`);
  } catch(e) {
    console.error(e);
  }
}

async function cleanBuildTarget() {
  await executeCommand('npm run clean');
}

async function buildProject() {
  await executeCommand('npm run build');
}

async function openBrowser() {
  switch (process.platform) {
    case 'darwin':
      await executeCommand('npm run open_browser_macos');
      break;
    case 'win32':
      await executeCommand('npm run open_browser_win');
      break;
    case 'linux':
      await executeCommand('npm run open_browser_linux');
      break;
    default:
      console.error('Unsupported platform!');
  }
}

async function main() {
  await cleanBuildTarget();
  await buildProject();
//  await openBrowser();
}

main();