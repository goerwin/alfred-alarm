import {
  cancelAllAlarms,
  cancelOrRestartOrSilenceAlarm,
  createAlarmOrTimer,
  removeAllAlarms,
  silenceAllAlarms,
} from '../helpers/helpersAlarm';
import { startBgProcess, stopBgProcess } from '../helpers/helpersProcess';
import { NewAlarmOrTimerAttrs } from '../helpers/schemas';

const action = process.env.action;

if (action === 'createTimer') {
  const minutes = Number(process.argv[2]);
  const title = process.argv.slice(5).join(' ');
  createAlarmOrTimer({
    type: 'timer',
    minutes,
    title,
    createdAt: new Date().toISOString(),
  } satisfies NewAlarmOrTimerAttrs);
}

if (action === 'cancelOrRestartOrSilence') cancelOrRestartOrSilenceAlarm(process.argv[2]);
if (action === 'silenceAll') silenceAllAlarms();
if (action === 'cancelAll') cancelAllAlarms();
if (action === 'removeAll') removeAllAlarms();
if (action === 'stopBgProcess') stopBgProcess();

startBgProcess();
