const childProcess = require('child_process');
const path = require('path');
const {
  getData,
  setData,
  sleep,
  getNextAlarmAndTimerItemState,
} = require('./helpers');
const helpersProcess = require('./helpersProcess');

(async () => {
  while (true) {
    const data = getData();
    const now = new Date();
    let updateData = false;

    const ALARM_REMINDER_DELAY_IN_MINS = data.alarmReminderInMins || 0;
    const ALARM_REMINDER_DELAY_IN_MS = ALARM_REMINDER_DELAY_IN_MINS * 60 * 1000;

    const items = data.items.map((item) => {
      const isAlarmProcessRunning = helpersProcess.isFamilyProcess(item.pid);
      const newItem = getNextAlarmAndTimerItemState({
        item,
        now,
        reminderBeforeInMs: ALARM_REMINDER_DELAY_IN_MS,
        isAlarmProcessRunning,
      });

      if (!updateData && item !== newItem) updateData = true;

      if (!isAlarmProcessRunning && newItem.status === 'ringing') {
        updateData = true;
        const childProcessEl = helpersProcess.triggerAlarm(
          item.title,
          data.alarmFilePath
        );
        newItem.pid = childProcessEl.pid;
      }

      return newItem;
    });

    if (updateData) setData({ ...data, items });

    await sleep(10);
  }
})();
