// import { describe, test, expect } from '@jest/globals';

import {
  getAlarmWeekDays,
  getNextAlarmDate,
  getNextDayOfWeekDate,
} from './helpers';

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
