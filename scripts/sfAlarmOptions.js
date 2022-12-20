// TODO: NO NEEDED

const { getAlarmWeekDays } = require('./helpers');
const { getHoursMinsInfo } = require('goerwin-helpers/universal/time');

const timeInput = process.argv[2];
const days = process.argv[3] || '';
const title = process.argv.slice(4).join(' ') || '';
const hoursMinsInfo = getHoursMinsInfo(timeInput);

if (!hoursMinsInfo) {
  return console.log(
    JSON.stringify({
      items: [
        {
          valid: false,
          title: 'Oops!',
          subtitle:
            'Invalid syntax! (egs. "425pm" or "1625 walk dog" or "2pm 34 this will repeat on wed/thu")',
        },
      ],
    })
  );
}

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

console.log(
  JSON.stringify({
    items: [
      {
        variables: {
          action: 'create',
          notificationTitle: 'Alarm created!',
          notificationMsg: `Alarm will fire at ${hrsMinsFormatted}`,
        },
        title: `New Alarm - ${hrsMinsFormatted} ${weekDaysFormatted}`,
        subtitle: `"${newTitle}" at ${hrsMinsFormatted}`,
        arg: `${hrsMinsFormatted} ${hours} ${minutes} ${days} ${newTitle}`,
      },
    ],
  })
);
