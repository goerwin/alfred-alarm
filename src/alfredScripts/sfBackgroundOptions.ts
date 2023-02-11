import { getBgProcess } from '../helpers/helpersProcess';
import { timeDiffByDates } from 'goerwin-helpers/universal/time';
import { outputAlfredItems } from '../helpers/general';

const bgProcess = getBgProcess();

if (bgProcess) {
  const bgProcessDate = new Date(bgProcess?.createdAt ?? Date.now());
  const dateFormatted = bgProcessDate.toDateString() + ', ' + bgProcessDate.toLocaleTimeString();

  outputAlfredItems([
    {
      variables: { action: 'stopBgProcess' },
      title: `Status: Running 🟢 :: PID: ${bgProcess.pid}`,
      subtitle: `Started: ${dateFormatted} - Running for ${timeDiffByDates(
        new Date(),
        new Date(bgProcess.createdAt)
      )} - Press Enter to Stop it`,
    },
  ]);
} else
  outputAlfredItems([
    {
      variables: { action: 'startBgProcess' },
      title: 'Status: Not running 🔴',
      subtitle: 'Press Enter to Start it',
    },
  ]);
