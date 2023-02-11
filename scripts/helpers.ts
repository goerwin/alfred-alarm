import fs from 'fs-extra';
import path from 'path';
import { Data, DataItem, DataSchema } from './schemas';

function getDataPath() {
  if (!process.env.dataFilePath)
    throw new Error('environment variable "dataFilePath" not defined');

  const home = process.env['HOME'] || '';
  return path.resolve(process.env.dataFilePath.replace(/^~/, home));
}

export function getData() {
  const data = fs.readFileSync(getDataPath(), { encoding: 'utf8' });
  if (data) return DataSchema.parse(JSON.parse(data));
  return { bgProcess: undefined, items: [] };
}

export function setData(newData: Data) {
  fs.writeFileSync(
    getDataPath(),
    JSON.stringify(DataSchema.parse(newData), null, 2),
    { encoding: 'utf8' }
  );
}

export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// TODO: () => console.log(JSON.stringify(...))
export function outputItems(items: any[]) {
  console.log(
    JSON.stringify({
      items,
    })
  );
}

export function getNextStateItem(
  item: DataItem,
  now: Date,
  options: { reminderBeforeInMs: number; alarmToleranceInMs: number }
): DataItem {
  const { alarmToleranceInMs = 60000, reminderBeforeInMs = 0 } = options;
  const nowWithReminder = now.valueOf() - reminderBeforeInMs;

  if (item.type === 'alarmOneTime') {
    const itemDate = new Date(now);
    itemDate.setUTCHours(item.hours);
    itemDate.setUTCMinutes(item.minutes);
    itemDate.setUTCSeconds(0);
    itemDate.setUTCMilliseconds(0);

    const timeDiff = itemDate.valueOf() - nowWithReminder;
    const isInTriggerTime = Math.abs(timeDiff) <= alarmToleranceInMs;

    if (item.status === 'missed') {
      if (isInTriggerTime) return { ...item, status: 'active' };
    } else if (item.status === 'ringing') {
      if (!isInTriggerTime) return { ...item, status: 'inactive' };
    } else if (item.status === 'silenced') {
      if (!isInTriggerTime) return { ...item, status: 'inactive' };
    } else if (item.status === 'active') {
      if (isInTriggerTime) return { ...item, status: 'ringing' };
    }
  }

  return item;
}

/** str is a string between 1 and 7 chars and each one is a number between 1 a 7
representing the days of the week: 1 for monday, 2 for tuesday... 7 sunday
example: 12345 for all weekdays, 67 for weekends */
export function getAlarmWeekDays(str: string) {
  if (!str || str.length > 7) return null;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const strIsoWeekDays = [];
  const isoWeekDays = [];

  let lastDay = 0;
  for (let idx = 0; idx < str.length; idx++) {
    const number = Number(str[idx]);
    if (isNaN(number)) return null;
    if (number <= lastDay) return null;
    if (number > 7) return null;
    lastDay = number;
    strIsoWeekDays.push(days[number - 1]);
    isoWeekDays.push(number % 7);
  }

  return { isoWeekDays, strIsoWeekDays };
}

export function getNextDayOfWeekDate(attrs: {
  now: Date | string;
  dayOfWeek: number;
  hours: number;
  minutes: number;
}) {
  const { dayOfWeek, hours, minutes } = attrs;
  const now = new Date(attrs.now);
  const nextDate = new Date(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + ((7 + dayOfWeek - now.getUTCDay()) % 7)
  );

  nextDate.setUTCHours(hours);
  nextDate.setUTCMinutes(minutes);

  if (nextDate < now) nextDate.setDate(nextDate.getDate() + 7);
  return nextDate;
}

export function getNextAlarmDate(attrs: {
  now: Date | string;
  hours: number;
  minutes: number;
  isoWeekDays?: number[];
}) {
  const { hours, minutes, isoWeekDays } = attrs;
  const now = new Date(attrs.now);
  const alarmDate = new Date(now);
  alarmDate.setUTCHours(hours);
  alarmDate.setUTCMinutes(minutes);
  alarmDate.setUTCSeconds(0);
  alarmDate.setUTCMilliseconds(0);

  if (!isoWeekDays) {
    const timeDiff = alarmDate.valueOf() - now.valueOf();
    if (timeDiff < 0) alarmDate.setDate(alarmDate.getDate() + 1);
    return alarmDate;
  }

  return isoWeekDays.reduce((prev, dayOfWeek) => {
    const value = getNextDayOfWeekDate({ now, dayOfWeek, hours, minutes });
    if (value < prev) return value;
    return prev;
  }, new Date('99999/12/12'));
}
