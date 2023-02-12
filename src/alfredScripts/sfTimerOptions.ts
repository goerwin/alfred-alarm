const time = process.argv[2];
const title = process.argv.slice(3).join(' ') || 'Timer';
import { getSeconds } from 'goerwin-helpers/universal/time';
import { outputAlfredItems } from '../helpers/general';

const parsedSeconds = getSeconds(time);

if (!parsedSeconds) {
  outputAlfredItems([
    {
      valid: false,
      title: 'Oops!',
      subtitle: 'Invalid syntax! (eg. "10 turn on house lights")',
    },
  ]);
} else {
  const parsedMins = Math.round(parsedSeconds / 60);
  const minsFormatted = `${parsedMins} minute${parsedMins !== 1 ? 's' : ''}`;

  outputAlfredItems([
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
  ]);
}
