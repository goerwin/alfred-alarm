const childProcess = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const helpersProcess = require('./helpersProcess');

function getDataPath() {
  if (!process.env.dataFilePath)
    throw new Error('environment variable "dataFilePath" not defined');
  return path.resolve(process.env.dataFilePath.replace(/^~/, process.env.HOME));
}

function getData() {
  const data = fs.readFileSync(getDataPath(), { encoding: 'utf8' });
  if (data) return JSON.parse(data);
  return { bgProcess: null, items: [] };
}

function setData(newData) {
  fs.writeFileSync(getDataPath(), JSON.stringify(newData || '', null, 2), {
    encoding: 'utf8',
  });
}

function getBgProcess() {
  const { bgProcess } = getData();
  const bgProcessPid = bgProcess?.pid;

  if (helpersProcess.isFamilyProcess(bgProcessPid)) return bgProcess;
  return null;
}

function stopBgProcess() {
  const { pid } = getBgProcess() ?? {};
  if (pid) helpersProcess.killProcessesWithSameGPIDAsPID(pid);
  const data = getData();
  setData({ ...data, bgProcess: null });
}

// It will create an independent process with a new group
// process id (detach) parent will spin it and forget it
function createDetachedIndependentProcess(scriptAbsPath, env) {
  const childProcessEl = childProcess.fork(scriptAbsPath, {
    env,
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  });
  childProcessEl.unref();
  childProcessEl.disconnect();
  return childProcessEl;
}

function startBgProcess() {
  if (getBgProcess()) return;

  const indProcess = createDetachedIndependentProcess(
    path.resolve(__dirname, 'background.js'),
    { ...process.env, isAlfredAlarmProcess: true }
  );

  const startDate = new Date();
  setData({
    ...getData(),
    bgProcess: {
      pid: indProcess.pid,
      startDate: startDate.toISOString(),
      startDateFormatted:
        startDate.toDateString() + ', ' + startDate.toLocaleTimeString(),
    },
  });
}

function sleep(seconds) {
  return new Promise((res) => setTimeout(res, seconds * 1000));
}

function createAlarm(attrs) {
  const data = getData();
  const MAX_ITEMS = data.maxItems || 50;

  if (data.items.length >= MAX_ITEMS)
    return helpersProcess.showNotification(
      `Error: Too many items. Max: ${MAX_ITEMS}`
    );

  const { title, isoDays, strDays, onRepeat } = attrs;
  const { type, hrsMinsFormatted, hours, minutes, minutesTimer } = attrs;
  const now = new Date();

  let endDate = new Date();

  endDate.setHours(hours);
  endDate.setMinutes(minutes);
  endDate.setSeconds(0);
  endDate.setMilliseconds(0);

  if (onRepeat) endDate = getDateToNextAlarm(now, hours, minutes, isoDays);

  if (type === 'timer')
    endDate = new Date(now.valueOf() + Number(minutesTimer) * 60 * 1000);

  if (endDate - now <= 0) endDate.setDate(endDate.getDate() + 1);

  setData({
    ...data,
    items: [
      {
        id: now.valueOf(),
        title: title.trim(),
        status: 'active',
        onRepeat,
        type,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        hrsMinsFormatted,
        hours,
        minutes,
        isoDays,
        strDays,
        daysFormatted: strDays?.join(', '),
        minutesTimer,
      },
      ...data.items,
    ],
  });
}

function silenceAlarm(id) {
  const data = getData();
  const item = data.items.find((el) => el.id === id);
  const status = item?.status;
  const pid = item?.pid;

  if (status !== 'ringing') return;

  if (helpersProcess.isFamilyProcess(pid))
    helpersProcess.killProcessesWithPPIDEqualToPID(pid);

  setData({
    ...data,
    items: data.items.map((el) =>
      el.id !== id ? el : { ...el, status: 'silenced' }
    ),
  });
}

function cancelAlarm(id) {
  const data = getData();
  const item = data.items.find((el) => el.id === id);
  const status = item?.status;

  if (!item || !['active', 'ringing'].includes(status)) return;
  silenceAlarm(id);

  setData({
    ...data,
    items: data.items.map((el) =>
      el.id !== id ? el : { ...el, status: 'completed' }
    ),
  });
}

function deleteAlarm(id) {
  const data = getData();
  cancelAlarm(id);
  setData({ ...data, items: data.items.filter((el) => el.id !== id) });
}

function cancelOrRestartOrSilenceAlarm(id) {
  const data = getData();
  const item = data.items.find((el) => el.id === id);

  if (!item) return;

  const { status } = item;
  if (status === 'active') cancelAlarm(id);
  else if (status === 'ringing') silenceAlarm(id);
  else {
    const newItem = { ...item };
    deleteAlarm(id);
    createAlarm({ ...newItem });
  }
}

function removeAllAlarms() {
  const data = getData();
  data.items.forEach((el) => deleteAlarm(el.id));
}

function silenceAllAlarms() {
  const data = getData();
  data.items.forEach((el) => silenceAlarm(el.id));
}

function cancelAllAlarms() {
  const data = getData();
  data.items.forEach((el) => cancelAlarm(el.id));
}

function getTimeStr(seconds, unitInSecs, subunitInSecs, unitStr, subunitStr) {
  const quotient = Math.floor(seconds / unitInSecs);

  if (quotient < 1) return null;

  const result = `${quotient}${unitStr}`;
  const timer = seconds % unitInSecs;

  const subUnitTimer =
    subunitInSecs > 0 ? Math.floor(timer / subunitInSecs) : timer;

  if (subUnitTimer > 0) return `${result} ${subUnitTimer}${subunitStr}`;
  return result;
}

function getAlarmWeekDays(str) {
  if (!str || str.length > 7) return null;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const strDays = [];
  const isoDays = [];

  let lastDay = 0;
  for (let idx = 0; idx < str.length; idx++) {
    const number = Number(str[idx]);
    if (isNaN(number)) return null;
    if (number <= lastDay) return null;
    if (number > 7) return null;
    lastDay = number;
    strDays.push(days[number - 1]);
    isoDays.push(number % 7);
  }

  return { isoDays, strDays };
}

function nextDayAndTime(now, dayOfWeek, hour, minute) {
  now = new Date(now);
  const nextDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + ((7 + Number(dayOfWeek) - now.getDay()) % 7),
    Number(hour),
    Number(minute)
  );

  if (nextDate < now) nextDate.setDate(nextDate.getDate() + 7);
  return nextDate;
}

function getDateToNextAlarm(now, hrs, mins, isoDays) {
  now = new Date(now);

  return isoDays.reduce((prev, weekDay) => {
    const value = nextDayAndTime(now, weekDay, hrs, mins);
    if (!prev) return value;
    if (value < prev) return value;
    return prev;
  }, null);
}

function getNextAlarmAndTimerItemState({
  item,
  now,
  reminderBeforeInMs = 0,
  isAlarmProcessRunning,
}) {
  const ALARM_TOLERANCE = 60000;
  const { status, hours, minutes, isoDays, onRepeat, type } = item;
  const isAlarm = !type || type === 'alarm';
  const endDate = onRepeat
    ? getDateToNextAlarm(item.endDate, hours, minutes, isoDays)
    : new Date(item.endDate);

  if (
    isAlarm &&
    onRepeat &&
    (status === 'silenced' || (status === 'ringing' && !isAlarmProcessRunning))
  )
    return {
      ...item,
      status: 'active',
      endDate: getDateToNextAlarm(
        new Date(new Date(item.endDate).getTime() + 1),
        hours,
        minutes,
        isoDays
      ).toISOString(),
    };

  let msToAlarm = endDate - now;

  // to trigger alarm with a delay set on reminder
  if (isAlarm) msToAlarm = msToAlarm - reminderBeforeInMs;

  if (status === 'ringing' && isAlarmProcessRunning) return item;

  // ringing alarm silenced/finished completely
  if (status === 'silenced' || (status === 'ringing' && !isAlarmProcessRunning))
    return { ...item, status: 'completed' };

  // alarm date not reached
  if (msToAlarm > 0) return item;

  // ignore non active alarms
  if (status !== 'active') return item;

  // alarm date reached, trigger it
  // if the alarm is not triggered and a minute hasn't passed, trigger it
  if (msToAlarm >= -ALARM_TOLERANCE) return { ...item, status: 'ringing' };

  // alarm missed
  return { ...item, status: onRepeat ? 'active' : 'missed' };
}

module.exports = {
  getData,
  setData,
  startBgProcess,
  getBgProcess,
  stopBgProcess,
  getAlarmWeekDays,
  nextDayAndTime,
  getDateToNextAlarm,
  sleep,
  createAlarm,
  cancelAlarm,
  deleteAlarm,
  cancelOrRestartOrSilenceAlarm,
  removeAllAlarms,
  silenceAllAlarms,
  cancelAllAlarms,
  getNextAlarmAndTimerItemState,
};
