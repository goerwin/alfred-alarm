const {
  getAlarmWeekDays,
  getDateToNextAlarm,
  nextDayAndTime,
  getNextAlarmAndTimerItemState,
} = require('./helpers');

it('getAlarmWeekDays should work', () => {
  [
    [
      '1234567',
      {
        isoDays: [1, 2, 3, 4, 5, 6, 0],
        strDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
    ],
    ['1', { isoDays: [1], strDays: ['Mon'] }],
    ['7', { isoDays: [0], strDays: ['Sun'] }],
    ['12', { isoDays: [1, 2], strDays: ['Mon', 'Tue'] }],
    ['124', { isoDays: [1, 2, 4], strDays: ['Mon', 'Tue', 'Thu'] }],
    ['37', { isoDays: [3, 0], strDays: ['Wed', 'Sun'] }],
    ['0', null],
    ['8', null],
    ['11', null],
    ['122', null],
    ['368', null],
    ['', null],
    ['12abc', null],
  ].forEach((el) => expect(getAlarmWeekDays(el[0])).toEqual(el[1]));
});

it('nextDayAndTime should work', () => {
  [
    ['2022-02-03T07:00:00.000Z', 4, 2, 0, '2022-02-03T07:00:00.000Z'],
    ['2022-02-03T07:00:00.000Z', 4, 2, 1, '2022-02-03T07:01:00.000Z'],
    ['2022-02-03T07:00:00.000Z', 4, 1, 59, '2022-02-10T06:59:00.000Z'],
    ['2022-02-03T07:00:00.000Z', 3, 2, 0, '2022-02-09T07:00:00.000Z'],
    ['2022-02-03T07:00:00.000Z', 1, 2, 0, '2022-02-07T07:00:00.000Z'],
    ['2022-02-26T07:00:00.000Z', 1, 14, 0, '2022-02-28T19:00:00.000Z'],
    ['2022-02-26T07:00:00.000Z', 1, 20, 0, '2022-03-01T01:00:00.000Z'],
  ].forEach((el) =>
    expect(nextDayAndTime(el[0], el[1], el[2], el[3])).toEqual(new Date(el[4]))
  );
});

it('getDateToNextAlarm should work', () => {
  [
    ['2022-02-03T07:00:00.000Z', 2, 0, [4, 6], '2022-02-03T07:00:00.000Z'],
    ['2022-02-03T07:00:00.000Z', 2, 0, [4, 0], '2022-02-03T07:00:00.000Z'],
    ['2022-02-03T07:01:00.000Z', 2, 1, [3, 5], '2022-02-04T07:01:00.000Z'],
    ['2022-02-03T07:01:00.000Z', 2, 1, [5, 3], '2022-02-04T07:01:00.000Z'],
    [
      '2022-02-03T07:00:00.000Z',
      2,
      5,
      [1, 2, 3, 4, 5, 6, 0],
      '2022-02-03T07:05:00.000Z',
    ],
    ['2022-02-03T07:00:00.000Z', 2, 0, [4, 6], '2022-02-03T07:00:00.000Z'],
    ['2022-02-03T07:00:59.000Z', 2, '1', [4], '2022-02-03T07:01:00.000Z'],
    ['2022-02-03T07:01:00.000Z', '2', 1, [4], '2022-02-03T07:01:00.000Z'],
    ['2022-02-03T07:01:01.000Z', '2', 1, [4], '2022-02-10T07:01:00.000Z'],
  ].forEach((el) =>
    expect(getDateToNextAlarm(el[0], el[1], el[2], el[3])).toEqual(
      new Date(el[4])
    )
  );
});

describe('alarmAndTimerTrigger', () => {
  describe('No repeat alarms', () => {
    describe('Active alarms', () => {
      const item = {
        title: 'Alarm',
        status: 'active',
        endDate: '2022-11-11T20:00:00.000Z',
      };

      it('should return same item if alarm still far away', () => {
        const now = new Date('2022-10-10T16:00:00.000Z');
        const res = getNextAlarmAndTimerItemState({ item, now });
        expect(res).toBe(item);
      });

      it('should return same item if alarm about to be triggered', () => {
        const now = new Date('2022-11-11T19:59:59.999Z');
        const res = getNextAlarmAndTimerItemState({ item, now });
        expect(res).toBe(item);
      });

      it('should set state to ringing if alarm is on time', () => {
        const now = new Date('2022-11-11T20:00:00.000Z');
        const res = getNextAlarmAndTimerItemState({ item, now });
        expect(res).toEqual({ ...item, status: 'ringing' });
      });

      it('should set state to ringing if alarm is passed for a minute or less', () => {
        const now = new Date('2022-11-11T20:00:59.999Z');
        const res = getNextAlarmAndTimerItemState({ item, now });
        expect(res).toEqual({ ...item, status: 'ringing' });

        const now2 = new Date('2022-11-11T20:01:00.000Z');
        const res2 = getNextAlarmAndTimerItemState({
          item,
          now: now2,
        });
        expect(res2).toEqual({ ...item, status: 'ringing' });
      });

      it('should set state to missed if alarm is passed for more than a minute', () => {
        const now = new Date('2022-11-11T20:01:00.001Z');
        const res = getNextAlarmAndTimerItemState({ item, now });
        expect(res).toEqual({ ...item, status: 'missed' });
      });

      it('should trigger alarm with a reminder of 1 minute', () => {
        const now = new Date('2022-11-11T19:59:00.000Z');
        const res = getNextAlarmAndTimerItemState({
          item,
          now,
          reminderBeforeInMs: 60000,
        });
        expect(res).toEqual({ ...item, status: 'ringing' });
      });
    });

    describe('Ringing alarms', () => {
      const item = {
        title: 'Alarm',
        status: 'ringing',
        endDate: '2022-11-11T20:00:00.000Z',
      };

      it('should return same state if alarmProcess is running', () => {
        const now = new Date('2022-11-11T20:00:00.001Z');
        const res = getNextAlarmAndTimerItemState({
          item,
          now,
          isAlarmProcessRunning: true,
        });
        expect(res).toBe(item);
      });

      it('should set state to complete alarmProcess is not running', () => {
        const now = new Date('2022-11-11T20:00:00.001Z');
        const res = getNextAlarmAndTimerItemState({ item, now });
        expect(res).toEqual({ ...item, status: 'completed' });
      });
    });

    describe('Completed alarms', () => {
      const item = {
        title: 'Alarm',
        status: 'completed',
        endDate: '2022-11-11T20:00:00.000Z',
      };

      it('should return same state if alarm completed', () => {
        const now = new Date('2022-11-11T20:00:00.001Z');
        const res = getNextAlarmAndTimerItemState({ item, now });
        expect(res).toBe(item);
      });
    });

    describe('Silenced alarms', () => {
      const item = {
        title: 'Alarm',
        status: 'silenced',
        endDate: '2022-11-11T20:00:00.000Z',
      };

      it('should set state to completed', () => {
        const now = new Date('2022-11-11T20:00:00.000Z');
        const res = getNextAlarmAndTimerItemState({ item, now });
        expect(res).toEqual({ ...item, status: 'completed' });
      });
    });
  });

  describe('Repeat alarms', () => {
    describe('Active alarms', () => {
      const item = {
        onRepeat: true,
        title: 'Alarm',
        status: 'active',
        endDate: '2022-11-11T20:00:00.000Z',
        isoDays: [1, 5], // TODO: this is local time zone
        hours: 15, // TODO: this is local time zone
        minutes: 0, // TODO: this is local time zone
      };

      it('should return same item if alarm about to be triggered', () => {
        const now = new Date('2022-11-11T19:59:59.999Z');
        const res = getNextAlarmAndTimerItemState({ item, now });
        expect(res).toBe(item);
      });

      it('should set state to ringing if alarm is on time', () => {
        const now = new Date('2022-11-11T20:00:00.000Z');
        const res = getNextAlarmAndTimerItemState({ item, now });
        expect(res).toEqual({ ...item, status: 'ringing' });
      });

      it('should set state to ringing if alarm is passed for a minute or less', () => {
        const now = new Date('2022-11-11T20:00:59.999Z');
        const res = getNextAlarmAndTimerItemState({ item, now });
        expect(res).toEqual({ ...item, status: 'ringing' });

        const now2 = new Date('2022-11-11T20:01:00.000Z');
        const res2 = getNextAlarmAndTimerItemState({ item, now: now2 });
        expect(res2).toEqual({ ...item, status: 'ringing' });
      });

      it('should set state to active if alarm is passed for more than a minute', () => {
        const now = new Date('2022-11-11T20:01:00.001Z');
        const res = getNextAlarmAndTimerItemState({ item, now });
        expect(res).toEqual({ ...item, status: 'active' });
      });

      it.todo(
        'should remove enddate/startdate,use hours/minutes/isodays and replace startdate with createdAt/updatedAt'
      );
    });

    describe('Ringing alarms', () => {
      const item = {
        onRepeat: true,
        title: 'Alarm',
        status: 'ringing',
        endDate: '2022-11-11T20:00:00.000Z',
        isoDays: [1, 5],
        hours: 15,
        minutes: 0,
      };

      it('should return same state if alarmProcess is running', () => {
        const now = new Date('2022-11-11T20:00:00.001Z');
        const res = getNextAlarmAndTimerItemState({
          item,
          now,
          isAlarmProcessRunning: true,
        });
        expect(res).toBe(item);
      });

      it('should set state to active if alarmProcess is not running and update to next endDate', () => {
        const now = new Date('2022-11-11T20:00:00.001Z');
        const res = getNextAlarmAndTimerItemState({ item, now });
        expect(res).toEqual({
          ...item,
          status: 'active',
          endDate: '2022-11-14T20:00:00.000Z',
        });
      });
    });

    describe('Silenced alarms', () => {
      const item = {
        onRepeat: true,
        title: 'Alarm',
        status: 'silenced',
        endDate: '2022-11-11T20:00:00.000Z',
        isoDays: [1, 5],
        hours: 15,
        minutes: 0,
      };

      it('should set state to active and update to next endDate', () => {
        const now = new Date('2022-11-11T20:00:00.001Z');
        const res = getNextAlarmAndTimerItemState({
          item,
          now,
          isAlarmProcessRunning: true,
        });

        expect(res).toEqual({
          ...item,
          status: 'active',
          endDate: '2022-11-14T20:00:00.000Z',
        });
      });
    });

    describe('Completed alarms', () => {
      const item = {
        onRepeat: true,
        title: 'Alarm',
        status: 'completed',
        isoDays: [1, 5],
        hours: 15,
        minutes: 0,
      };

      it('should return same state', () => {
        const now = new Date('2022-11-11T20:00:00.000Z');
        const res = getNextAlarmAndTimerItemState({ item, now });
        expect(res).toBe(item);
      });
    });
  });

  describe('Timer', () => {});
});
