const {
  getData,
  startBgProcess,
  cancelOrRestartOrSilenceAlarm,
  deleteAlarm,
  getAlarmWeekDays,
} = require('./helpers');
const {
  timeDiffByDates,
  getHoursMinsInfo,
} = require('goerwin-helpers/universal/time');
const { createAlarm } = require('./helpers');

startBgProcess();

function getNewAlarmItem(processArgv) {
  const timeInput = processArgv[2];
  const days = processArgv[3] || '';
  const title = processArgv.slice(4).join(' ') || '';
  const hoursMinsInfo = getHoursMinsInfo(timeInput || '');

  if (!hoursMinsInfo)
    return {
      valid: false,
      title: 'Oops!',
      subtitle:
        'Invalid syntax! (egs. "425pm" or "1625 walk dog" or "2pm 34 this will repeat on wed/thu")',
    };

  const { hours, minutes, hrsMinsFormatted } = hoursMinsInfo;

  const alarmWeekDays = getAlarmWeekDays(days);
  const weekDaysFormatted = alarmWeekDays
    ? `🔃 ${alarmWeekDays.strDays.join(', ')}`
    : '';

  let newTitle = title ? title : 'Alarm';
  newTitle = alarmWeekDays
    ? `${newTitle}`
    : days
    ? title
      ? `${days} ${newTitle}`
      : days
    : newTitle;

  return {
    variables: {
      action: 'create',
      // notificationTitle: 'Alarm created!',
      // notificationMsg: `Alarm will fire at ${hrsMinsFormatted}`,

      // title: alarmWeekDays ? title : days,
      // onRepeat: !!alarmWeekDays,
      // isoDays: alarmWeekDays?.isoDays,
      // strDays: alarmWeekDays?.strDays,

      // title: `New Alarm - ${hrsMinsFormatted} ${weekDaysFormatted}`,
      // subtitle: `"${newTitle}" at ${hrsMinsFormatted}`,
      // arg: `${hrsMinsFormatted} ${hours} ${minutes} ${days} ${newTitle}`,

      item: JSON.stringify({
        title: newTitle,
        hours,
        minutes,
        onRepeat: !!alarmWeekDays,
        isoDays: alarmWeekDays?.isoDays,
        strDays: alarmWeekDays?.strDays,
        hrsMinsFormatted,
      }),

      // hrsMinsFormatted,
      // alarmWeekDays,
      // days,
      // minutes,
      // hours,
    },

    title: `New Alarm - ${hrsMinsFormatted} ${weekDaysFormatted}`,
    subtitle: `"${newTitle}" at ${hrsMinsFormatted}`,
    // arg: `${hrsMinsFormatted} ${hours} ${minutes} ${days} ${newTitle}`,
  };
}

function getItems(uidPrefix) {
  const data = getData();
  uidPrefix = process.env.uidPrefix ? process.env.uidPrefix : uidPrefix;

  const userInput = process.argv.slice(2).join(' ').trim();

  const newItems = data.items
    .map((el) => {
      let title = '';
      let subtitle = '';
      let match = '';
      let endDate;
      let icon;
      const { hrsMinsFormatted, status, daysFormatted, type, onRepeat } = el;
      const { hours, minutes } = el;
      const statusTxt = status[0].toUpperCase() + status.slice(1);
      const daysFormattedStr = onRepeat ? ` 🔃 ${daysFormatted}` : '';
      title = `Alarm: ${hrsMinsFormatted}${daysFormattedStr}`;

      if (type === 'timer') {
        title = `Timer: ${hrsMinsFormatted}`;
        match = `${title} ${el.title}`;
      } else {
        const strMins = String(minutes).padStart(2, '0');
        match = `Alarm: ${hrsMinsFormatted} ${hrsMinsFormatted.replace(
          /[:]/g,
          ''
        )} ${hours}:${strMins} ${hours}${strMins} ${daysFormattedStr} ${
          el.title
        }`;
      }

      subtitle = `${statusTxt}`;

      if (status === 'ringing') {
        title = `${title} - 🔔 - ${el.title}`;
        subtitle += ` - Press Enter to silence`;
      } else if (status === 'active') {
        const now = new Date();
        endDate = new Date(el.endDate);
        const elTimeDiff = timeDiffByDates(now, endDate);
        const endDateFormatted =
          endDate.toDateString() + ', ' + endDate.toLocaleTimeString();

        const elTimeDiffStr = endDate - now > 0 ? `⏳ ${elTimeDiff}` : '⏳';

        title = `${title} - ${elTimeDiffStr} - ${el.title}`;
        subtitle += ` - ${endDateFormatted} - Press Enter to cancel`;
      } else if (status === 'completed' || status === 'missed') {
        endDate = new Date(el.endDate);
        const endDateFormatted =
          endDate.toDateString() + ', ' + endDate.toLocaleTimeString();
        title = `${title} - ${el.title}`;
        subtitle += ` - ${endDateFormatted} - Press Enter to restart`;
        icon = { path: 'resources/icon-gray.png' };
      }

      return {
        variables: { action: 'cancelOrRestartOrSilence', itemId: el.id },
        mods: {
          cmd: {
            subtitle: 'Delete',
            variables: { action: 'delete', itemId: el.id },
          },
        },
        endDate,
        title,
        match,
        subtitle,
        // uid: uidPrefix + el.id,
        status,
        icon,
      };
    })
    .sort((a, b) => {
      if (a.status === 'ringing') return -1;
      if (b.status === 'ringing') return 1;

      if (a.status === 'active' && a.status === b.status)
        return a.endDate === b.endDate ? 0 : a.endDate < b.endDate ? -1 : 1;

      if (a.status === b.status)
        return a.title === b.title ? 0 : a.title < b.title ? -1 : 1;

      if (
        ['completed', 'missed'].includes(a.status) &&
        ['completed', 'missed'].includes(b.status)
      )
        return a.title === b.title ? 0 : a.title < b.title ? -1 : 1;

      return a.status === b.status ? 0 : a.status < b.status ? -1 : 1;
    })
    .filter((item) =>
      item.match.toLowerCase().includes(userInput.toLowerCase())
    );

  newItems.push(getNewAlarmItem(process.argv));

  return {
    // rerun: 2,
    variables: { uidPrefix },
    items: newItems,
  };
}

const action = process.env.action;
const itemId = Number(process.env.itemId);

if (action === 'create') {
  const item = process.env.item;

  console.error('kekw', { item: JSON.parse(item) });
  createAlarm({ ...JSON.parse(item) });
}

if (action === 'delete' && itemId) {
  deleteAlarm(itemId);
}

if (action === 'cancelOrRestartOrSilence' && itemId) {
  cancelOrRestartOrSilenceAlarm(itemId);
}

console.log(JSON.stringify(getItems(new Date().toISOString())));
