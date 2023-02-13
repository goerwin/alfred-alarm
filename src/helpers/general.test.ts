import { getNextDayOfWeekDate, getNextStateItem, getNextTriggerDate, getWeekDaysInfo } from './general';
import { DataItem } from './schemas';

function alarmItemGenerator(attrs: { type: DataItem['type']; status: DataItem['status']; timerMinutes?: number }): [DataItem, DataItem] {
  if (attrs.type === 'alarmOneTime') {
    const item: DataItem = {
      type: 'alarmOneTime',
      status: attrs.status,
      isoHours: 7,
      isoMinutes: 0,
      createdAt: '',
      id: '',
      title: '',
    };

    return [item, { ...item }];
  } else if (attrs.type === 'alarmRepeat' && attrs.status !== 'missed') {
    const item: DataItem = {
      type: 'alarmRepeat',
      status: attrs.status,
      isoHours: 7,
      isoMinutes: 0,
      isoWeekDays: [0, 3],
      createdAt: '',
      id: '',
      title: '',
    };

    return [item, { ...item }];
  } else if (attrs.type === 'timer') {
    const item: DataItem = {
      type: 'timer',
      status: attrs.status,
      minutes: attrs.timerMinutes || 10,
      createdAt: '2022-11-20T07:00:00.000Z',
      id: '',
      title: '',
    };

    return [item, { ...item }];
  }

  throw new Error('Invalid attrs');
}

it(`${getWeekDaysInfo.name} should work`, () => {
  (
    [
      ['1234567', { hours: 12, minutes: 0, timezoneOffsetInMins: 0 }, { weekDays: [1, 2, 3, 4, 5, 6, 0], hours: 12, minutes: 0 }],
      ['1', { hours: 12, minutes: 0, timezoneOffsetInMins: 0 }, { weekDays: [1], hours: 12, minutes: 0 }],
      ['7', { hours: 12, minutes: 0, timezoneOffsetInMins: 0 }, { weekDays: [0], hours: 12, minutes: 0 }],
      ['12', { hours: 12, minutes: 0, timezoneOffsetInMins: 0 }, { weekDays: [1, 2], hours: 12, minutes: 0 }],
      ['124', { hours: 12, minutes: 0, timezoneOffsetInMins: 0 }, { weekDays: [1, 2, 4], hours: 12, minutes: 0 }],
      ['37', { hours: 12, minutes: 0, timezoneOffsetInMins: 0 }, { weekDays: [3, 0], hours: 12, minutes: 0 }],
      ['0', { hours: 12, minutes: 0, timezoneOffsetInMins: 0 }, null],
      ['8', { hours: 12, minutes: 0, timezoneOffsetInMins: 0 }, null],
      ['11', { hours: 12, minutes: 0, timezoneOffsetInMins: 0 }, null],
      ['122', { hours: 12, minutes: 0, timezoneOffsetInMins: 0 }, null],
      ['368', { hours: 12, minutes: 0, timezoneOffsetInMins: 0 }, null],
      ['', { hours: 12, minutes: 0, timezoneOffsetInMins: 0 }, null],
      ['12abc', { hours: 12, minutes: 0, timezoneOffsetInMins: 0 }, null],

      // with timezoneoffsets
      ['1', { hours: 23, minutes: 57, timezoneOffsetInMins: 2 }, { weekDays: [1], hours: 23, minutes: 59 }],
      ['1', { hours: 23, minutes: 58, timezoneOffsetInMins: 2 }, { weekDays: [2], hours: 0, minutes: 0 }],
      ['24', { hours: 23, minutes: 57, timezoneOffsetInMins: 2 }, { weekDays: [2, 4], hours: 23, minutes: 59 }],
      ['24', { hours: 23, minutes: 58, timezoneOffsetInMins: 2 }, { weekDays: [3, 5], hours: 0, minutes: 0 }],
      ['26', { hours: 23, minutes: 58, timezoneOffsetInMins: 2 }, { weekDays: [3, 0], hours: 0, minutes: 0 }],
      ['27', { hours: 23, minutes: 58, timezoneOffsetInMins: 2 }, { weekDays: [3, 1], hours: 0, minutes: 0 }],
      ['27', { hours: 0, minutes: 1, timezoneOffsetInMins: -2 }, { weekDays: [1, 6], hours: 23, minutes: 59 }],
    ] as const
  ).forEach((el) => expect(getWeekDaysInfo(el[0], el[1])).toEqual(el[2]));
});

it(`${getNextDayOfWeekDate.name} should work`, () => {
  (
    [
      ['2022-11-20T07:00:00.000Z', 4, 7, 0, '2022-11-24T07:00:00.000Z'],
      ['2022-11-20T07:00:00.000Z', 4, 7, 59, '2022-11-24T07:59:00.000Z'],
      ['2022-11-20T07:00:00.000Z', 0, 7, 0, '2022-11-20T07:00:00.000Z'],
      ['2022-11-20T07:00:00.001Z', 0, 7, 0, '2022-11-27T07:00:00.000Z'],
    ] as const
  ).forEach((el) => expect(getNextDayOfWeekDate({ now: el[0], dayOfWeek: el[1], hours: el[2], minutes: el[3] })).toEqual(new Date(el[4])));
});

it(`${getNextTriggerDate.name} should work`, () => {
  (
    [
      ['2022-11-20T07:00:00.000Z', 7, 0, [4, 0], '2022-11-20T07:00:00.000Z'],
      ['2022-11-20T07:00:00.001Z', 7, 0, [4, 0], '2022-11-24T07:00:00.000Z'],
      ['2022-11-20T07:00:00.000Z', 7, 0, [4, 6], '2022-11-24T07:00:00.000Z'],
      ['2022-11-20T07:01:00.000Z', 7, 1, [3, 5], '2022-11-23T07:01:00.000Z'],
      ['2022-11-20T07:01:00.000Z', 7, 1, [5, 3], '2022-11-23T07:01:00.000Z'],
      ['2022-11-20T07:00:59.999Z', 7, 1, [0], '2022-11-20T07:01:00.000Z'],
      ['2022-11-20T07:01:00.000Z', 7, 1, [0], '2022-11-20T07:01:00.000Z'],
      ['2022-11-20T07:00:00.000Z', 7, 0, undefined, '2022-11-20T07:00:00.000Z'],
      ['2022-11-20T07:00:00.001Z', 7, 0, undefined, '2022-11-21T07:00:00.000Z'],
    ] satisfies [string, number, number, number[] | undefined, string][]
  ).forEach((el) =>
    expect(
      getNextTriggerDate({
        now: el[0],
        hours: el[1],
        minutes: el[2],
        isoWeekDays: el[3],
      })
    ).toEqual(new Date(el[4]))
  );
});

describe(`${getNextStateItem.name}`, () => {
  const [activeOneTimeAlarm, activeOneTimeAlarmCopy] = alarmItemGenerator({ type: 'alarmOneTime', status: 'active' });

  const [inactiveOneTimeAlarm, inactiveOneTimeAlarmCopy] = alarmItemGenerator({ type: 'alarmOneTime', status: 'inactive' });
  const [missedOneTimeAlarm, missedOneTimeAlarmCopy] = alarmItemGenerator({ type: 'alarmOneTime', status: 'missed' });
  const [ringingOneTimeAlarm, ringingOneTimeAlarmCopy] = alarmItemGenerator({ type: 'alarmOneTime', status: 'ringing' });
  const [silencedOneTimeAlarm, silencedOneTimeAlarmCopy] = alarmItemGenerator({ type: 'alarmOneTime', status: 'silenced' });
  const [activeRepeatAlarm, activeRepeatAlarmCopy] = alarmItemGenerator({ type: 'alarmRepeat', status: 'active' });
  const [inactiveRepeatAlarm, inactiveRepeatAlarmCopy] = alarmItemGenerator({ type: 'alarmRepeat', status: 'inactive' });
  const [ringingRepeatAlarm, ringingRepeatAlarmCopy] = alarmItemGenerator({ type: 'alarmRepeat', status: 'ringing' });
  const [silencedRepeatAlarm, silencedRepeatAlarmCopy] = alarmItemGenerator({ type: 'alarmRepeat', status: 'silenced' });
  const [activeTimer, activeTimerCopy] = alarmItemGenerator({ type: 'timer', status: 'active', timerMinutes: 10 });
  const [inactiveTimer, inactiveTimerCopy] = alarmItemGenerator({ type: 'timer', status: 'inactive', timerMinutes: 10 });
  const [missedTimer, missedTimerCopy] = alarmItemGenerator({ type: 'timer', status: 'missed', timerMinutes: 10 });
  const [ringingTimer, ringingTimerCopy] = alarmItemGenerator({ type: 'timer', status: 'ringing', timerMinutes: 10 });
  const [silencedTimer, silencedTimerCopy] = alarmItemGenerator({ type: 'timer', status: 'silenced', timerMinutes: 10 });

  it('should return same alarm item with object equality and same values', () => {
    (
      [
        // now, alarmToleranceInMs, reminderBeforeInMs
        [activeOneTimeAlarm, activeOneTimeAlarmCopy, '2022-11-20T06:59:59.999Z', 0, 0],
        [activeOneTimeAlarm, activeOneTimeAlarmCopy, '2022-11-20T07:00:00.001Z', 0, 0],
        [activeOneTimeAlarm, activeOneTimeAlarmCopy, '2022-11-20T06:59:59.999Z', 60000, 0],
        [activeOneTimeAlarm, activeOneTimeAlarmCopy, '2022-11-20T07:01:00.001Z', 60000, 0],

        [inactiveOneTimeAlarm, inactiveOneTimeAlarmCopy, '2022-11-20T06:59:59.999Z', 60000, 0],
        [inactiveOneTimeAlarm, inactiveOneTimeAlarmCopy, '2022-11-20T07:00:00.000Z', 60000, 0],
        [inactiveOneTimeAlarm, inactiveOneTimeAlarmCopy, '2022-11-20T07:00:00.001Z', 60000, 0],

        [missedOneTimeAlarm, missedOneTimeAlarmCopy, '2022-11-20T06:59:59.999Z', 60000, 0],
        [missedOneTimeAlarm, missedOneTimeAlarmCopy, '2022-11-20T07:01:00.001Z', 60000, 0],

        [ringingOneTimeAlarm, ringingOneTimeAlarmCopy, '2022-11-20T07:00:00.000Z', 60000, 0],
        [ringingOneTimeAlarm, ringingOneTimeAlarmCopy, '2022-11-20T07:01:00.000Z', 60000, 0],

        [silencedOneTimeAlarm, silencedOneTimeAlarmCopy, '2022-11-20T07:00:00.000Z', 60000, 0],
        [silencedOneTimeAlarm, silencedOneTimeAlarmCopy, '2022-11-20T07:01:00.000Z', 60000, 0],

        [activeRepeatAlarm, activeRepeatAlarmCopy, '2022-11-20T06:59:59.999Z', 0, 0],
        [activeRepeatAlarm, activeRepeatAlarmCopy, '2022-11-20T07:00:00.001Z', 0, 0],
        [activeRepeatAlarm, activeRepeatAlarmCopy, '2022-11-20T06:59:59.999Z', 60000, 0],
        [activeRepeatAlarm, activeRepeatAlarmCopy, '2022-11-20T07:01:00.001Z', 60000, 0],

        [ringingRepeatAlarm, ringingRepeatAlarmCopy, '2022-11-20T07:00:00.000Z', 60000, 0],
        [ringingRepeatAlarm, ringingRepeatAlarmCopy, '2022-11-20T07:01:00.000Z', 60000, 0],

        [ringingRepeatAlarm, ringingRepeatAlarmCopy, '2022-11-20T07:01:00.000Z', 60000, 0],
      ] as const
    ).forEach((el) => {
      // expect object reference equality
      expect(getNextStateItem(el[0], el[2], { alarmToleranceInMs: el[3], reminderBeforeInMs: el[4] })).toBe(el[0]);

      // expect equality of values between copy and original
      expect(el[0]).toEqual(el[1]);
    });
  });

  it('should return the same timer item with object equality and same values', () => {
    (
      [
        [activeTimer, activeTimerCopy, '2022-11-20T07:00:00.000Z'],
        [activeTimer, activeTimerCopy, '2022-11-20T07:09:59.999Z'],

        [ringingTimer, ringingTimerCopy, '2022-11-20T07:10:00.000Z'],
        [ringingTimer, ringingTimerCopy, '2022-11-20T07:11:00.000Z'],

        [silencedTimer, silencedTimerCopy, '2022-11-20T07:10:00.000Z'],
        [silencedTimer, silencedTimerCopy, '2022-11-20T07:11:00.000Z'],

        [missedTimer, missedTimerCopy, '2022-11-20T07:09:59.999Z'],
        [missedTimer, missedTimerCopy, '2022-11-20T07:10:00.000Z'],
        [missedTimer, missedTimerCopy, '2022-11-20T07:11:00.000Z'],
        [missedTimer, missedTimerCopy, '2022-11-20T07:11:00.001Z'],

        [inactiveTimer, inactiveTimerCopy, '2022-11-20T07:09:59.999Z'],
        [inactiveTimer, inactiveTimerCopy, '2022-11-20T07:10:00.000Z'],
        [inactiveTimer, inactiveTimerCopy, '2022-11-20T07:11:00.000Z'],
        [inactiveTimer, inactiveTimerCopy, '2022-11-20T07:11:00.001Z'],
      ] as const
    ).forEach((el) => {
      // expect object reference equality
      expect(getNextStateItem(el[0], el[2], { alarmToleranceInMs: 60000, reminderBeforeInMs: 0 })).toBe(el[0]);

      // expect equality of values between copy and original
      expect(el[0]).toEqual(el[1]);
    });
  });

  it('should return alarm item with expected status', () => {
    (
      [
        // alarm, now, alarmToleranceInMs, reminderBeforeInMs, expectedStatus
        // testing reminder/tolerance
        [activeOneTimeAlarm, '2022-11-20T06:59:59.999Z', 0, 0, 'active'],
        [activeOneTimeAlarm, '2022-11-20T07:00:00.000Z', 0, 0, 'ringing'],
        [activeOneTimeAlarm, '2022-11-20T07:00:00.001Z', 0, 0, 'active'],
        [activeOneTimeAlarm, '2022-11-20T06:59:29.999Z', 60000, 30000, 'active'],
        [activeOneTimeAlarm, '2022-11-20T06:59:30.000Z', 60000, 30000, 'ringing'],
        [activeOneTimeAlarm, '2022-11-20T07:00:30.000Z', 60000, 30000, 'ringing'],
        [activeOneTimeAlarm, '2022-11-20T07:00:30.001Z', 60000, 30000, 'active'],

        [activeOneTimeAlarm, '2022-11-20T06:59:59.999Z', 60000, 0, 'active'],
        [activeOneTimeAlarm, '2022-11-20T07:00:00.000Z', 60000, 0, 'ringing'],
        [activeOneTimeAlarm, '2022-11-20T07:01:00.000Z', 60000, 0, 'ringing'],
        [activeOneTimeAlarm, '2022-11-20T07:01:00.001Z', 60000, 0, 'active'],

        [inactiveOneTimeAlarm, '2022-11-20T06:59:59.999Z', 60000, 0, 'inactive'],
        [inactiveOneTimeAlarm, '2022-11-20T07:00:00.000Z', 60000, 0, 'inactive'],
        [inactiveOneTimeAlarm, '2022-11-20T07:00:00.001Z', 60000, 0, 'inactive'],

        [missedOneTimeAlarm, '2022-11-20T06:59:59.999Z', 60000, 0, 'missed'],
        [missedOneTimeAlarm, '2022-11-20T07:00:00.000Z', 60000, 0, 'inactive'],
        [missedOneTimeAlarm, '2022-11-20T07:01:00.000Z', 60000, 0, 'inactive'],
        [missedOneTimeAlarm, '2022-11-20T07:01:00.001Z', 60000, 0, 'missed'],

        [ringingOneTimeAlarm, '2022-11-20T06:59:59.999Z', 60000, 0, 'inactive'],
        [ringingOneTimeAlarm, '2022-11-20T07:00:00.000Z', 60000, 0, 'ringing'],
        [ringingOneTimeAlarm, '2022-11-20T07:01:00.000Z', 60000, 0, 'ringing'],
        [ringingOneTimeAlarm, '2022-11-20T07:01:00.001Z', 60000, 0, 'inactive'],

        [silencedOneTimeAlarm, '2022-11-20T06:59:59.999Z', 60000, 0, 'inactive'],
        [silencedOneTimeAlarm, '2022-11-20T07:00:00.000Z', 60000, 0, 'silenced'],
        [silencedOneTimeAlarm, '2022-11-20T07:01:00.000Z', 60000, 0, 'silenced'],
        [silencedOneTimeAlarm, '2022-11-20T07:01:00.001Z', 60000, 0, 'inactive'],

        [activeRepeatAlarm, '2022-11-20T06:59:59.999Z', 60000, 0, 'active'],
        [activeRepeatAlarm, '2022-11-20T07:00:00.000Z', 60000, 0, 'ringing'],
        [activeRepeatAlarm, '2022-11-20T07:01:00.000Z', 60000, 0, 'ringing'],
        [activeRepeatAlarm, '2022-11-23T07:01:00.000Z', 60000, 0, 'ringing'],
        [activeRepeatAlarm, '2022-11-20T07:01:00.001Z', 60000, 0, 'active'],
        [activeRepeatAlarm, '2022-11-21T07:01:00.000Z', 60000, 0, 'active'],
        [activeRepeatAlarm, '2022-11-22T07:01:00.000Z', 60000, 0, 'active'],

        [inactiveRepeatAlarm, '2022-11-20T06:59:59.999Z', 60000, 0, 'inactive'],
        [inactiveRepeatAlarm, '2022-11-20T07:00:00.000Z', 60000, 0, 'inactive'],
        [inactiveRepeatAlarm, '2022-11-20T07:00:00.001Z', 60000, 0, 'inactive'],

        [ringingRepeatAlarm, '2022-11-20T06:59:59.999Z', 60000, 0, 'active'],
        [ringingRepeatAlarm, '2022-11-20T07:00:00.000Z', 60000, 0, 'ringing'],
        [ringingRepeatAlarm, '2022-11-20T07:01:00.000Z', 60000, 0, 'ringing'],
        [ringingRepeatAlarm, '2022-11-23T07:01:00.000Z', 60000, 0, 'ringing'],
        [ringingRepeatAlarm, '2022-11-20T07:01:00.001Z', 60000, 0, 'active'],
        [ringingRepeatAlarm, '2022-11-21T07:01:00.000Z', 60000, 0, 'active'],
        [ringingRepeatAlarm, '2022-11-22T07:01:00.000Z', 60000, 0, 'active'],

        [silencedRepeatAlarm, '2022-11-20T06:59:59.999Z', 60000, 0, 'active'],
        [silencedRepeatAlarm, '2022-11-20T07:00:00.000Z', 60000, 0, 'silenced'],
        [silencedRepeatAlarm, '2022-11-20T07:01:00.000Z', 60000, 0, 'silenced'],
        [silencedRepeatAlarm, '2022-11-20T07:01:00.001Z', 60000, 0, 'active'],
      ] as const
    ).forEach((el) => expect(getNextStateItem(el[0], el[1], { alarmToleranceInMs: el[2], reminderBeforeInMs: el[3] })).toEqual({ ...el[0], status: el[4] }));
  });

  it('should return timer item with expected status', () => {
    (
      [
        [activeTimer, '2022-11-20T07:09:59.999Z', 'active'],
        [activeTimer, '2022-11-20T07:10:00.000Z', 'ringing'],
        [activeTimer, '2022-11-20T07:11:00.000Z', 'ringing'],
        [activeTimer, '2022-11-20T07:11:00.001Z', 'missed'],

        [ringingTimer, '2022-11-20T07:09:59.999Z', 'inactive'],
        [ringingTimer, '2022-11-20T07:10:00.000Z', 'ringing'],
        [ringingTimer, '2022-11-20T07:11:00.000Z', 'ringing'],
        [ringingTimer, '2022-11-20T07:11:00.001Z', 'inactive'],

        [silencedTimer, '2022-11-20T07:09:59.999Z', 'inactive'],
        [silencedTimer, '2022-11-20T07:10:00.000Z', 'silenced'],
        [silencedTimer, '2022-11-20T07:11:00.000Z', 'silenced'],
        [silencedTimer, '2022-11-20T07:11:00.001Z', 'inactive'],

        [missedTimer, '2022-11-20T07:09:59.999Z', 'missed'],
        [missedTimer, '2022-11-20T07:10:00.000Z', 'missed'],
        [missedTimer, '2022-11-20T07:11:00.000Z', 'missed'],
        [missedTimer, '2022-11-20T07:11:00.001Z', 'missed'],

        [inactiveTimer, '2022-11-20T07:09:59.999Z', 'inactive'],
        [inactiveTimer, '2022-11-20T07:10:00.000Z', 'inactive'],
        [inactiveTimer, '2022-11-20T07:11:00.000Z', 'inactive'],
        [inactiveTimer, '2022-11-20T07:11:00.001Z', 'inactive'],
      ] as const
    ).forEach((el) => expect(getNextStateItem(el[0], el[1], { alarmToleranceInMs: 60000, reminderBeforeInMs: 0 })).toEqual({ ...el[0], status: el[2] }));
  });
});

it.todo('test converting user input of weekdays with time to iso isoweekdays/hours/minutes');
