import fs from 'fs-extra';
import path from 'path';
import { AlfredItem, Data, DataItem, DataSchema } from './schemas';

export const DATA_PATH = path.resolve(__dirname, '../../data.json');
export const ALARM_PATH = path.resolve(__dirname, '../../resources/greatFairysFountainZeldaOOT.mp3');

export function getData() {
  const data = fs.readFileSync(DATA_PATH, { encoding: 'utf8' });
  if (data) return DataSchema.parse(JSON.parse(data));
  return { bgProcess: undefined, items: [] };
}

export function setData(newData: Data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(DataSchema.parse(newData), null, 2), {
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

export function getWeekDaysStr(isoWeekDays: [number, ...number[]]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  return isoWeekDays.map((el) => days[el]);
}

/** str is a string between 1 and 7 chars and each one is a number between 1 a 7
representing the days of the week: 1 for monday, 2 for tuesday... 7 sunday
example: 12345 for all weekdays, 67 for weekends */
export function getWeekDaysInfo(
  inputStr: string,
  options: { hours: number; minutes: number; timezoneOffsetInMins: number }
) {
  if (!inputStr || inputStr.length > 7 || inputStr.length < 1) return null;

  const weekDays: [number, ...number[]] = [0];

  /** UTC timezones varies from utc-12 to utc+14,
  meaning 14 hours of diference is the max between
  farthest timezone with utc, meaning it is safe
  to assume one day is the maximum variation

  examples:
  colombia utc-5 11pm => iso 4am nextday
  australia utc+11 1am => iso 2pm prevday
  */
  const localNow = new Date();
  const localHours = options.hours;
  const localMinutes = options.minutes;
  const timezoneOffsetInMs = options.timezoneOffsetInMins * 60 * 1000;

  localNow.setHours(localHours);
  localNow.setMinutes(localMinutes);

  const localNowInMs = localNow.valueOf();
  const offsetNowInMs = localNowInMs + timezoneOffsetInMs;
  const offsetNow = new Date(offsetNowInMs);

  const dayOffset =
    // localtime is behind UTC (eg. Offset for Colombia (UTC-5) is 18000000)
    timezoneOffsetInMs >= 0 && localNow.getDay() !== offsetNow.getDay()
      ? 1
      : // localtime is ahead UTC  (eg. Offset for Australia (UTC+11) is -39600000)
      localNow.getDay() !== offsetNow.getDay()
      ? -1
      : 0;

  let prevInputWeekDay = 0;
  for (let idx = 0; idx < inputStr.length; idx++) {
    const inputWeekDay = Number(inputStr[idx]);

    let weekDay = inputWeekDay % 7;
    weekDay = weekDay + dayOffset;
    weekDay = weekDay < 0 ? 6 : weekDay % 7;

    if (isNaN(weekDay)) return null;
    if (inputWeekDay < 1 || inputWeekDay > 7) return null;
    if (inputWeekDay <= prevInputWeekDay) return null;

    prevInputWeekDay = inputWeekDay;
    weekDays.push(weekDay);
  }

  // TODO: needed in order to create the non empty array type
  weekDays.shift();
  return { weekDays, hours: offsetNow.getHours(), minutes: offsetNow.getMinutes() };
}

export function getWeekDaysInputStrFromWeekDays(weekDays?: [number, ...number[]]) {
  if (!weekDays) return '';

  const sortedWeekDays = [...weekDays].sort();
  return sortedWeekDays.join('').replace('0', '7') || '';
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
  options: { reminderBeforeInMs: number; alarmToleranceInMs: number }
): DataItem {
  const { alarmToleranceInMs, reminderBeforeInMs } = options;
  const nowInMs = new Date(now).valueOf();

  if (item.type === 'timer') {
    const status = item.status;
    const timerCreatedAt = new Date(item.createdAt);
    const triggerDateValue = timerCreatedAt.valueOf() + item.minutes * 60 * 1000;
    const timeDiff = triggerDateValue - nowInMs;

    const isInTriggerTime = timeDiff <= 0 && timeDiff >= -alarmToleranceInMs;

    if (isInTriggerTime && status === 'active') return { ...item, status: 'ringing' };
    if (!isInTriggerTime && timeDiff < 0 && status === 'active')
      return { ...item, status: 'missed' };

    if (!isInTriggerTime && status === 'ringing') return { ...item, status: 'inactive' };
    if (!isInTriggerTime && status === 'silenced') return { ...item, status: 'inactive' };

    return item;
  }

  const triggerDate = getNextTriggerDate({
    now: new Date(nowInMs - alarmToleranceInMs),
    hours: item.isoHours,
    minutes: item.isoMinutes,
    isoWeekDays: item.type === 'alarmRepeat' ? item.isoWeekDays : undefined,
  });

  const timeDiff = triggerDate.valueOf() - nowInMs - reminderBeforeInMs;
  const isInTriggerTime = timeDiff <= 0 && timeDiff >= -alarmToleranceInMs;
  const { status } = item;

  if (status === 'ringing' && !isInTriggerTime)
    return {
      ...item,
      status: item.type === 'alarmRepeat' ? 'active' : 'inactive',
    };
  else if (status === 'missed' && isInTriggerTime) return { ...item, status: 'inactive' };
  else if (status === 'silenced' && !isInTriggerTime && item.type === 'alarmRepeat')
    return { ...item, status: 'active' };
  else if (status === 'silenced' && !isInTriggerTime) return { ...item, status: 'inactive' };
  else if (status === 'active' && isInTriggerTime) return { ...item, status: 'ringing' };
  else return item;
}
