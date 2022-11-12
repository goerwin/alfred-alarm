const shell = require('shelljs');
const path = require('path');
const childProcess = require('child_process');

function showNotification(message, title = 'Alarm') {
  shell.exec(
    `osascript -e 'display notification "${message}" with title "${title}"'`
  );
}

function killProcessesWithSameGPIDAsPID(pid) {
  const gpid = Number(shell.exec(`ps -o pgid ${pid} | tail -1`));
  if (isNaN(gpid)) return;
  shell.exec(`kill -- -${gpid}`);
}

function killProcessesWithPPIDEqualToPID(pid) {
  shell.exec(`pkill -P ${pid}`);
}

function getProcessEnvVariables(pid) {
  return shell.exec(`ps eww ${pid}`, { silent: true });
}

function isFamilyProcess(pid) {
  if (!pid) return false;
  const envVars = getProcessEnvVariables(pid);
  return envVars.match(/isAlfredAlarmProcess=([\w]*)/)?.[1] === 'true';
}

function triggerAlarm(title) {
  return childProcess.fork(
    path.resolve(__dirname, 'triggerAlarm.js'),
    { env: { ...process.env, title } }
  );
}

module.exports = {
  isFamilyProcess,
  killProcessesWithPPIDEqualToPID,
  killProcessesWithSameGPIDAsPID,
  showNotification,
  triggerAlarm,
};
