import {
  getAlarmWeekDays,
  getNextAlarmDate,
  getNextDayOfWeekDate,
  getNextStateItem,
} from './helperstssssss';
import { DataItem } from './schemas';

it(`${getAlarmWeekDays.name} should work`, () => {
  (
    [
      [
        '1234567',
        {
          isoWeekDays: [1, 2, 3, 4, 5, 6, 0],
          strIsoWeekDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        },
      ],
      ['1', { isoWeekDays: [1], strIsoWeekDays: ['Mon'] }],
      ['7', { isoWeekDays: [0], strIsoWeekDays: ['Sun'] }],
      ['12', { isoWeekDays: [1, 2], strIsoWeekDays: ['Mon', 'Tue'] }],
      [
        '124',
        { isoWeekDays: [1, 2, 4], strIsoWeekDays: ['Mon', 'Tue', 'Thu'] },
      ],
      ['37', { isoWeekDays: [3, 0], strIsoWeekDays: ['Wed', 'Sun'] }],
      ['0', null],
      ['8', null],
      ['11', null],
      ['122', null],
      ['368', null],
      ['', null],
      ['12abc', null],
    ] as const
  ).forEach((el) => expect(getAlarmWeekDays(el[0])).toEqual(el[1]));
});

it(`${getNextDayOfWeekDate.name} should work`, () => {
  (
    [
      ['2022-11-20T07:00:00.000Z', 4, 7, 0, '2022-11-24T07:00:00.000Z'],
      ['2022-11-20T07:00:00.000Z', 4, 7, 59, '2022-11-24T07:59:00.000Z'],
      ['2022-11-20T07:00:00.000Z', 0, 7, 0, '2022-11-20T07:00:00.000Z'],
      ['2022-11-20T07:00:00.001Z', 0, 7, 0, '2022-11-27T07:00:00.000Z'],
    ] as const
  ).forEach((el) =>
    expect(
      getNextDayOfWeekDate({
        now: el[0],
        dayOfWeek: el[1],
        hours: el[2],
        minutes: el[3],
      })
    ).toEqual(new Date(el[4]))
  );
});

it(`${getNextAlarmDate.name} should work`, () => {
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
      getNextAlarmDate({
        now: el[0],
        hours: el[1],
        minutes: el[2],
        isoWeekDays: el[3],
      })
    ).toEqual(new Date(el[4]))
  );
});

describe(`${getNextStateItem.name}`, () => {
  describe('active alarm', () => {
    const item: DataItem = {
      type: 'alarmOneTime',
      createdAt: '1999-11-20T00:00:00.000Z',
      hours: 7,
      minutes: 0,
      id: '1',
      status: 'active',
      title: '',
    };

    it('should return same item with object equality', () => {
      (
        [
          // now, alarmToleranceInMs, reminderBeforeInMs
          ['2022-11-20T06:59:59.999Z', 0, 0],
          ['2022-11-20T07:00:00.001Z', 0, 0],
          ['2022-11-20T06:59:59.999Z', 60000, 0],
          ['2022-11-20T07:01:00.001Z', 60000, 0],
        ] as const
      ).forEach((el) =>
        expect(
          getNextStateItem(item, el[0], {
            alarmToleranceInMs: el[1],
            reminderBeforeInMs: el[2],
          })
        ).toBe(item)
      );
    });

    it('should return item with expected status', () => {
      (
        [
          // now, alarmToleranceInMs, reminderBeforeInMs, expectedStatus
          ['2022-11-20T06:59:59.999Z', 0, 0, 'active'],
          ['2022-11-20T07:00:00.000Z', 0, 0, 'ringing'],
          ['2022-11-20T07:00:00.001Z', 0, 0, 'active'],
          ['2022-11-20T06:59:59.999Z', 60000, 0, 'active'],
          ['2022-11-20T07:00:00.000Z', 60000, 0, 'ringing'],
          ['2022-11-20T07:01:00.000Z', 60000, 0, 'ringing'],
          ['2022-11-20T07:01:00.001Z', 60000, 0, 'active'],
          ['2022-11-20T06:59:29.999Z', 60000, 30000, 'active'],
          ['2022-11-20T06:59:30.000Z', 60000, 30000, 'ringing'],
          ['2022-11-20T07:00:30.000Z', 60000, 30000, 'ringing'],
          ['2022-11-20T07:00:30.001Z', 60000, 30000, 'active'],
        ] as const
      ).forEach((el) =>
        expect(
          getNextStateItem(item, el[0], {
            alarmToleranceInMs: el[1],
            reminderBeforeInMs: el[2],
          })
        ).toEqual({ ...item, status: el[3] })
      );
    });
  });
});
