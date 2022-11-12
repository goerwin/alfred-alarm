const {
  getData,
  startBgProcess,
  getDateToNextAlarm,
  cancelOrRestartOrSilenceAlarm,
  deleteAlarm,
} = require('./helpers');
const { timeDiffByDates } = require('goerwin-helpers/universal/time');

startBgProcess();

function logItems(uidPrefix) {
  const data = getData();
  uidPrefix = process.env.uidPrefix ? process.env.uidPrefix : uidPrefix;

  if (data.items.length === 0)
    return console.log(
      JSON.stringify({
        items: [
          {
            valid: false,
            title: 'No Alarms/Timers',
            subtitle: 'No alarms or timers found',
          },
        ],
      })
    );

  console.log(
    JSON.stringify({
      // rerun: 2,
      variables: { uidPrefix },
      items: data.items
        .map((el) => {
          let title = '';
          let subtitle = '';
          let match = '';
          let endDate;
          let icon;
          const { hrsMinsFormatted, status, daysFormatted, type, onRepeat } =
            el;
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

          if (status === 'ringing') {
            title = `${title} - 🔔 - ${el.title}`;
            subtitle = `${statusTxt} - Press Enter to silence`;
          } else if (status === 'active') {
            const now = new Date();
            const { isoDays, hours, minutes } = el;
            endDate = isoDays
              ? getDateToNextAlarm(now, hours, minutes, isoDays)
              : new Date(el.endDate);
            const elTimeDiff = timeDiffByDates(now, endDate);
            const endDateFormatted =
              endDate.toDateString() + ', ' + endDate.toLocaleTimeString();

            const elTimeDiffStr = endDate - now > 0 ? `⏳ ${elTimeDiff}` : '⏳';

            title = `${title} - ${elTimeDiffStr} - ${el.title}`;
            subtitle = `${statusTxt} - ${endDateFormatted} - Press Enter to cancel`;
          } else if (status === 'completed' || status === 'missed') {
            endDate = new Date(el.endDate);
            const endDateFormatted =
              endDate.toDateString() + ', ' + endDate.toLocaleTimeString();
            title = `${title} - ${el.title}`;
            subtitle = `${statusTxt} - ${endDateFormatted} - Press Enter to restart`;
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
        }),
    })
  );
}

const action = process.env.action;
const itemId = Number(process.env.itemId);

if (action === 'delete' && itemId) {
  deleteAlarm(itemId);
}

if (action === 'cancelOrRestartOrSilence' && itemId) {
  cancelOrRestartOrSilenceAlarm(itemId);
}

logItems(new Date().toISOString());
