import fs from 'fs-extra';
import path from 'path';
import { AlfredItem, Data, DataItem, DataSchema } from './schemas';

function getDataPath() {
  if (!process.env.dataFilePath) throw new Error('environment variable "dataFilePath" not defined');

  const home = process.env['HOME'] || '';
  // return path.resolve(process.env.dataFilePath.replace(/^~/, home));
  // TODO:
  return path.resolve(
    '~/My Drive/Alfred/Alfred.alfredpreferences/workflows/user.workflow.BB989380-994D-4BE0-A548-403D629D08F7/data.typescript.tests.json'.replace(
      /^~/,
      home
    )
  );
}

export function getData() {
  const data = fs.readFileSync(getDataPath(), { encoding: 'utf8' });
  if (data) return DataSchema.parse(JSON.parse(data));
  return { bgProcess: undefined, items: [] };
}

export function setData(newData: Data) {
  fs.writeFileSync(getDataPath(), JSON.stringify(DataSchema.parse(newData), null, 2), {
    encoding: 'utf8',
  });
}

export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export function outputAlfredItems(items: AlfredItem[], additionals: Record<string, any> = {}) {
  console.log(
    JSON.stringify({
      ...additionals,

      items,
    })
  );
}

/** str is a string between 1 and 7 chars and each one is a number between 1 a 7
representing the days of the week: 1 for monday, 2 for tuesday... 7 sunday
example: 12345 for all weekdays, 67 for weekends */
export function getAlarmWeekDays(str: string) {
  if (!str || str.length > 7 || str.length < 1) return null;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const strIsoWeekDays: [string, ...string[]] = [''];
  const isoWeekDays: [number, ...number[]] = [0];

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

  // TODO: needed in order to create the non empty array type
  isoWeekDays.shift();
  strIsoWeekDays.shift();
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

export function getNextTriggerDate(attrs: {
  now: Date | string;
  hours: number;
  minutes: number;
  isoWeekDays?: number[];
}) {
  const { hours, minutes, isoWeekDays } = attrs;
  const now = new Date(attrs.now);
  const triggerDate = new Date(now);
  triggerDate.setUTCHours(hours);
  triggerDate.setUTCMinutes(minutes);
  triggerDate.setUTCSeconds(0);
  triggerDate.setUTCMilliseconds(0);

  if (!isoWeekDays) {
    const timeDiff = triggerDate.valueOf() - now.valueOf();
    if (timeDiff < 0) triggerDate.setDate(triggerDate.getDate() + 1);
    return triggerDate;
  }

  return isoWeekDays.reduce((prev, dayOfWeek) => {
    const value = getNextDayOfWeekDate({ now, dayOfWeek, hours, minutes });
    if (value < prev) return value;
    return prev;
  }, new Date('99999/12/12'));
}

export function getNextStateItem(
  item: DataItem,
  now: Date | string,
  options?: { reminderBeforeInMs: number; alarmToleranceInMs: number }
): DataItem {
  const { alarmToleranceInMs = 60000, reminderBeforeInMs = 0 } = options || {};
  const parsedNow = new Date(now);
  const nowInMs = parsedNow.valueOf();

  if (item.type === 'timer') return item;

  const triggerDate = getNextTriggerDate({
    now: new Date(nowInMs - alarmToleranceInMs),
    hours: item.hours,
    minutes: item.minutes,
    isoWeekDays: item.type === 'alarmRepeat' ? item.isoWeekDays : undefined,
  });

  const timeDiff = triggerDate.valueOf() - nowInMs - reminderBeforeInMs;
  const isInTriggerTime = timeDiff <= 0 && timeDiff >= -alarmToleranceInMs;

  if (item.status === 'ringing' && !isInTriggerTime)
    return {
      ...item,
      status: item.type === 'alarmRepeat' ? 'active' : 'inactive',
    };
  else if (item.status === 'missed' && isInTriggerTime) return { ...item, status: 'inactive' };
  else if (item.status === 'silenced' && !isInTriggerTime) return { ...item, status: 'inactive' };
  else if (item.status === 'active' && isInTriggerTime) return { ...item, status: 'ringing' };
  else return item;
}
