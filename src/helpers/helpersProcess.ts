import shell from 'shelljs';
import path from 'path';
import childProcess from 'child_process';
import { getData, setData } from './general';

export function showNotification(message: string, title = 'Alarm') {
  shell.exec(`osascript -e 'display notification "${message}" with title "${title}"'`);
}

export function killProcessesWithSameGPIDAsPID(pid: number) {
  const gpid = Number(shell.exec(`ps -o pgid ${pid} | tail -1`));
  if (isNaN(gpid)) return;
  shell.exec(`kill -- -${gpid}`);
}

export function killProcessesWithPPIDEqualToPID(pid: number) {
  shell.exec(`pkill -P ${pid}`);
}

export function triggerAlarm(title: string) {
  return childProcess.fork(path.resolve(__dirname, '../triggerAlarm.js'), {
    env: { ...process.env, title },
  });
}

// It will create an independent process with a new group
// process id (detach) parent will spin it and forget it
function createDetachedIndependentProcess(scriptAbsPath: string, env: Record<string, any>) {
  const childProcessEl = childProcess.fork(scriptAbsPath, {
    env,
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  });
  childProcessEl.unref();
  childProcessEl.disconnect();
  return childProcessEl;
}

function getProcessEnvVariables(pid: number) {
  return shell.exec(`ps eww ${pid}`, { silent: true });
}

export function isFamilyProcess(pid: number) {
  if (!pid) return false;
  const envVars = getProcessEnvVariables(pid);
  return envVars.match(/isAlfredAlarmProcess=([\w]*)/)?.[1] === 'true';
}

export function getBgProcess() {
  const { bgProcess } = getData();
  const bgProcessPid = bgProcess?.pid;

  if (!bgProcessPid) return null;
  if (isFamilyProcess(bgProcessPid)) return bgProcess;

  return null;
}

export function startBgProcess() {
  if (getBgProcess()) return;

  const indProcess = createDetachedIndependentProcess(
    path.resolve(__dirname, '../', 'background.js'),
    { ...process.env, isAlfredAlarmProcess: true }
  );

  if (!indProcess.pid) return;

  setData({
    ...getData(),
    bgProcess: { pid: indProcess.pid, createdAt: new Date().toISOString() },
  });
}

export function stopBgProcess() {
  const { pid } = getBgProcess() ?? {};
  if (pid) killProcessesWithSameGPIDAsPID(pid);
  const data = getData();
  setData({ ...data, bgProcess: undefined });
}
