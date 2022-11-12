const {
  cancelOrRestartOrSilenceAlarm,
  removeAllAlarms,
  silenceAllAlarms,
  createAlarm,
  cancelAllAlarms,
  startBgProcess,
  stopBgProcess,
  getAlarmWeekDays,
} = require('./helpers');

const action = process.env.action;

startBgProcess();

if (action === 'create') {
  const hrsMinsFormatted = process.argv[2];
  const hours = Number(process.argv[3]);
  const minutes = Number(process.argv[4]);
  const days = process.argv[5];
  const alarmWeekDays = getAlarmWeekDays(days);
  const title = process.argv.slice(6).join(' ');

  createAlarm({
    title: alarmWeekDays ? title : days,
    hours,
    minutes,
    onRepeat: !!alarmWeekDays,
    isoDays: alarmWeekDays?.isoDays,
    strDays: alarmWeekDays?.strDays,
    hrsMinsFormatted,
  });
}

if (action === 'createTimer') {
  const minutesTimer = Number(process.argv[2]);
  const hrsMinsFormatted = process.argv.slice(3, 5).join(' ');
  const title = process.argv.slice(5).join(' ');
  createAlarm({ type: 'timer', minutesTimer, title, hrsMinsFormatted });
}

if (action === 'cancelOrRestartOrSilence')
  cancelOrRestartOrSilenceAlarm(Number(process.argv[2]));
if (action === 'silenceAll') silenceAllAlarms();
if (action === 'cancelAll') cancelAllAlarms();
if (action === 'removeAll') removeAllAlarms();

if (action === 'stopBgProcess') stopBgProcess();
