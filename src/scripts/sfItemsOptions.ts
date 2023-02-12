import {
  getData,
  getWeekDaysInfo,
  getNextTriggerDate,
  outputAlfredItems,
  getWeekDaysStr,
} from '../helpers/general';
import { timeDiffByDates, getHoursMinsInfo } from 'goerwin-helpers/universal/time';
import { startBgProcess } from '../helpers/helpersProcess';
import {
  cancelOrRestartOrSilenceAlarm,
  createAlarmOrTimer,
  deleteAlarm,
} from '../helpers/helpersAlarm';
import { AlfredItem, NewAlarmOrTimerAttrs } from '../helpers/schemas';

function getNewAlfredItem(processArgv: string[]): AlfredItem {
  const timeInput = processArgv[2];
  const weekdays = processArgv[3] || '';
  const title = processArgv.slice(4).join(' ') || '';
  const hoursMinsInfo = getHoursMinsInfo(timeInput || '');

  if (!hoursMinsInfo)
    return {
      valid: false,
      title: 'Ups!',
      subtitle:
        'Invalid syntax! (egs. "425pm" or "1625 walk dog" or "2pm 34 this will repeat on wed/thu")',
    };

  const { hours, minutes, hrsMinsFormatted } = hoursMinsInfo;

  const isoWeekDays = getWeekDaysInfo(weekdays);
  const weekDaysFormatted = isoWeekDays
    ? `🔃 ${getWeekDaysStr(isoWeekDays.weekDays).join(', ')}`
    : '';

  let newTitle = title ? title : 'Alarm';
  newTitle = isoWeekDays
    ? `${newTitle}`
    : weekdays
    ? title
      ? `${weekdays} ${newTitle}`
      : weekdays
    : newTitle;

  const newAlarmItem: NewAlarmOrTimerAttrs = {
    createdAt: new Date().toISOString(),
    isoHours: hours,
    isoMinutes: minutes,
    title: newTitle,
    ...(isoWeekDays
      ? { type: 'alarmRepeat', isoWeekDays: isoWeekDays.weekDays }
      : { type: 'alarmOneTime' }),
  };

  return {
    title: `New Alarm - ${hrsMinsFormatted} ${weekDaysFormatted}`,
    subtitle: `"${newTitle}" at ${hrsMinsFormatted}`,
    variables: { action: 'create', item: JSON.stringify(newAlarmItem) },
  };
}

// TODO: Theres a bug where you open the list, filter out an active item, press enter,
// filter it out again, see that the status hasn't change!
// the status change on enter, but when you start searching it goes back to previous (weird!!)
function getAlfredItems(): AlfredItem[] {
  const data = getData();
  const userInput = process.argv.slice(2).join(' ').trim();

  return [
    ...data.items
      .map((item) => {
        let title = '';
        let match = '';
        let icon;

        const { status, type, createdAt } = item;
        const now = new Date();
        let subtitle = `${status[0].toUpperCase() + status.slice(1)}`;
        const triggerDate =
          type === 'timer'
            ? new Date(new Date(createdAt).valueOf() + item.minutes * 60 * 1000)
            : getNextTriggerDate({
                hours: item.isoHours,
                minutes: item.isoMinutes,
                now,
                isoWeekDays: type === 'alarmRepeat' ? item.isoWeekDays : undefined,
              });

        const triggerDateFormatted =
          triggerDate.toDateString() + ', ' + triggerDate.toLocaleTimeString();

        if (type === 'timer') {
          title = `Timer: ${item.minutes} minute${item.minutes !== 1 ? 's' : ''}`;
          match = `${title} ${item.title}`;
        } else {
          const localHours = triggerDate.getHours();
          const localMins = triggerDate.getMinutes();
          const hrsMinsFormatted =
            getHoursMinsInfo(`${localHours}:${localMins.toFixed().padStart(2, '0')}`)
              ?.hrsMinsFormatted ?? '';

          const daysFormattedStr =
            type === 'alarmRepeat'
              ? ` 🔃 ${getWeekDaysInfo(item.isoWeekDays.join(''))?.strIsoWeekDays.join(', ')}`
              : '';
          title = `Alarm: ${hrsMinsFormatted}${daysFormattedStr}`;
          const strMins = String(localMins).padStart(2, '0');
          const m1 = `${hrsMinsFormatted} ${hrsMinsFormatted.replace(/:/g, '')}`;
          const m2 = `${hrsMinsFormatted} ${hrsMinsFormatted.replace(/:00/g, '')}`;

          match = `Alarm: ${m1} ${m2} ${localHours}:${strMins} ${localHours}${strMins} ${daysFormattedStr} ${item.title}`;
        }

        if (status === 'active') {
          const elTimeDiff = timeDiffByDates(now, triggerDate);
          const elTimeDiffStr =
            triggerDate.valueOf() - now.valueOf() > 0 ? `⏳ ${elTimeDiff}` : '⏳';

          title = `${title} - ${elTimeDiffStr} - ${item.title}`;
          subtitle += ` - ${triggerDateFormatted} - Press Enter to cancel`;
        } else if (status === 'ringing') {
          title = `${title} - 🔔 - ${item.title}`;
          subtitle += ` - Press Enter to silence`;
        } else if (status === 'inactive' || status === 'missed') {
          title = `${title} - ${item.title}`;
          subtitle += ` - ${triggerDateFormatted} - Press Enter to restart`;
          icon = { path: 'resources/icon-gray.png' };
        }

        return {
          variables: { action: 'cancelOrRestartOrSilence', itemId: item.id },
          mods: { cmd: { subtitle: 'Delete', variables: { action: 'delete', itemId: item.id } } },
          triggerDate,
          title,
          match,
          subtitle,
          status,
          icon,
        };
      })
      .sort((a, b) => {
        if (a.status === 'ringing') return -1;
        if (b.status === 'ringing') return 1;

        if (a.status === 'active' && a.status === b.status)
          return a.triggerDate === b.triggerDate ? 0 : a.triggerDate < b.triggerDate ? -1 : 1;

        if (a.status === b.status) return a.title === b.title ? 0 : a.title < b.title ? -1 : 1;

        if (['inactive', 'missed'].includes(a.status) && ['inactive', 'missed'].includes(b.status))
          return a.title === b.title ? 0 : a.title < b.title ? -1 : 1;

        return a.status === b.status ? 0 : a.status < b.status ? -1 : 1;
      })
      .filter((item) => item.match.toLowerCase().includes(userInput.toLowerCase())),
    getNewAlfredItem(process.argv),
  ];
}

const action = process.env.action;
const itemId = process.env.itemId;

if (action === 'create') {
  const item = process.env.item;
  item && createAlarmOrTimer(JSON.parse(item));
}

if (action === 'delete' && itemId) {
  deleteAlarm(itemId);
}

if (action === 'cancelOrRestartOrSilence' && itemId) {
  cancelOrRestartOrSilenceAlarm(itemId);
}

startBgProcess();
outputAlfredItems(getAlfredItems(), [
  {
    variables: {
      uidPrefix: process.env.uidPrefix ? process.env.uidPrefix : new Date().toISOString(),
    },
  },
]);
