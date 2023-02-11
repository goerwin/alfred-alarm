import { getData, getNextStateItem, setData, sleep } from './helpers';
import * as helpersProcess from './helpersProcess';

async function main(attrs: { loopDelayInMs: number }) {
  while (true) {
    const data = getData();
    const now = new Date();
    let updateData = false;

    const ALARM_REMINDER_DELAY_IN_MINS = data.alarmReminderInMins || 0;
    const ALARM_REMINDER_DELAY_IN_MS = ALARM_REMINDER_DELAY_IN_MINS * 60 * 1000;

    const items = data.items.map((item) => {
      const isAlarmProcessRunning =
        item.pid && helpersProcess.isFamilyProcess(item.pid);

      // const newItem = { ...item };
      const newItem = getNextStateItem(item, now, {
        reminderBeforeInMs: ALARM_REMINDER_DELAY_IN_MS,
        alarmToleranceInMs: 60000,
      });

      if (item !== newItem) updateData = true;

      if (item.pid && isAlarmProcessRunning && newItem.status !== 'ringing')
        helpersProcess.killProcessesWithPPIDEqualToPID(item.pid);
      else if (!isAlarmProcessRunning && newItem.status === 'ringing') {
        const childProcessEl = helpersProcess.triggerAlarm(
          item.title,
          data.alarmFilePath
        );

        newItem.pid = childProcessEl.pid;
        updateData = true;
      }

      return newItem;
    });

    if (updateData) setData({ ...data, items });

    await sleep(attrs.loopDelayInMs);
  }
}

main({ loopDelayInMs: 10000 });
