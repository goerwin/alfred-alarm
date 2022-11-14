import shell from 'shelljs';
import path from 'path';
import childProcess from 'child_process';

export function showNotification(message: string, title = 'Alarm') {
  shell.exec(
    `osascript -e 'display notification "${message}" with title "${title}"'`
  );
}

export function killProcessesWithSameGPIDAsPID(pid: number) {
  const gpid = Number(shell.exec(`ps -o pgid ${pid} | tail -1`));
  if (isNaN(gpid)) return;
  shell.exec(`kill -- -${gpid}`);
}

export function killProcessesWithPPIDEqualToPID(pid: number) {
  shell.exec(`pkill -P ${pid}`);
}

function getProcessEnvVariables(pid: number) {
  return shell.exec(`ps eww ${pid}`, { silent: true });
}

export function isFamilyProcess(pid: number) {
  if (!pid) return false;
  const envVars = getProcessEnvVariables(pid);
  return envVars.match(/isAlfredAlarmProcess=([\w]*)/)?.[1] === 'true';
}

export function triggerAlarm(title: string, alarmFilePath: string) {
  return childProcess.fork(path.resolve(__dirname, 'triggerAlarm.js'), {
    env: { ...process.env, title, alarmFilePath },
  });
}
