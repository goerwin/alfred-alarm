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
} else if (action === 'cancelOrRestartOrSilence') cancelOrRestartOrSilenceAlarm(process.argv[2]);
else if (action === 'silenceAll') silenceAllAlarms();
else if (action === 'cancelAll') cancelAllAlarms();
else if (action === 'removeAll') removeAllAlarms();
else if (action === 'stopBgProcess') stopBgProcess();
else startBgProcess();
