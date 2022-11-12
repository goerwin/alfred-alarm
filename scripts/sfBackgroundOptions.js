const { getBgProcess } = require('./helpers');
const { timeDiffByDates } = require('goerwin-helpers/universal/time');

const bgProcess = getBgProcess();

if (bgProcess)
  return console.log(
    JSON.stringify({
      items: [
        {
          variables: { action: 'stopBgProcess' },
          title: `Status: Running 🟢 :: PID: ${bgProcess.pid}`,
          subtitle: `Started: ${
            bgProcess.startDateFormatted
          } - Running for ${timeDiffByDates(
            new Date(),
            new Date(bgProcess.startDate)
          )} - Press Enter to Stop it`,
        },
      ],
    })
  );

console.log(
  JSON.stringify({
    items: [
      {
        variables: { action: 'startBgProcess' },
        title: 'Status: Not running 🔴',
        subtitle: 'Press Enter to Start it',
      },
    ],
  })
);
