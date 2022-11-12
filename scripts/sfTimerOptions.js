const time = process.argv[2];
const title = process.argv.slice(3).join(' ') || 'Timer';
const { getSeconds } = require('goerwin-helpers/universal/time');

const parsedSeconds = getSeconds(time);

if (!parsedSeconds) {
  return console.log(
    JSON.stringify({
      items: [
        {
          valid: false,
          title: 'Oops!',
          subtitle: 'Invalid syntax! (eg. "10 turn on house lights")',
        },
      ],
    })
  );
}

const parsedMins = Math.round(parsedSeconds / 60);

const minsFormatted = `${parsedMins} minute${parsedMins !== 1 ? 's' : ''}`;

console.log(
  JSON.stringify({
    items: [
      {
        variables: {
          action: 'createTimer',
          notificationTitle: 'Timer created!',
          notificationMsg: `Timer will fire in ${minsFormatted}`,
        },
        title: `New Timer - in ${minsFormatted}`,
        subtitle: `"${title}" in ${minsFormatted}`,
        arg: `${parsedMins} ${minsFormatted} ${title}`,
      },
    ],
  })
);
