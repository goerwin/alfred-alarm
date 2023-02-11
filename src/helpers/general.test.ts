import { getAlarmWeekDays, getNextTriggerDate, getNextDayOfWeekDate, getNextStateItem } from "./general";
import { DataItem } from "./schemas";

function alarmItemGenerator(attrs: { type: DataItem["type"]; status: DataItem["status"] }): [DataItem, DataItem] {
  if (attrs.type === "alarmOneTime") {
    const item: DataItem = {
      type: "alarmOneTime",
      status: attrs.status,
      hours: 7,
      minutes: 0,
      createdAt: "",
      id: "",
      title: "",
    };

    return [item, { ...item }];
  } else if (attrs.type === "alarmRepeat" && attrs.status !== "missed") {
    const item: DataItem = {
      type: "alarmRepeat",
      status: attrs.status,
      hours: 7,
      minutes: 0,
      isoWeekDays: [0, 3],
      createdAt: "",
      id: "",
      title: "",
    };

    return [item, { ...item }];
  }

  throw new Error("Invalid attrs");
}

it(`${getAlarmWeekDays.name} should work`, () => {
  (
    [
      ["1234567", { isoWeekDays: [1, 2, 3, 4, 5, 6, 0], strIsoWeekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }],
      ["1", { isoWeekDays: [1], strIsoWeekDays: ["Mon"] }],
      ["7", { isoWeekDays: [0], strIsoWeekDays: ["Sun"] }],
      ["12", { isoWeekDays: [1, 2], strIsoWeekDays: ["Mon", "Tue"] }],
      ["124", { isoWeekDays: [1, 2, 4], strIsoWeekDays: ["Mon", "Tue", "Thu"] }],
      ["37", { isoWeekDays: [3, 0], strIsoWeekDays: ["Wed", "Sun"] }],
      ["0", null],
      ["8", null],
      ["11", null],
      ["122", null],
      ["368", null],
      ["", null],
      ["12abc", null],
    ] as const
  ).forEach((el) => expect(getAlarmWeekDays(el[0])).toEqual(el[1]));
});

it(`${getNextDayOfWeekDate.name} should work`, () => {
  (
    [
      ["2022-11-20T07:00:00.000Z", 4, 7, 0, "2022-11-24T07:00:00.000Z"],
      ["2022-11-20T07:00:00.000Z", 4, 7, 59, "2022-11-24T07:59:00.000Z"],
      ["2022-11-20T07:00:00.000Z", 0, 7, 0, "2022-11-20T07:00:00.000Z"],
      ["2022-11-20T07:00:00.001Z", 0, 7, 0, "2022-11-27T07:00:00.000Z"],
    ] as const
  ).forEach((el) => expect(getNextDayOfWeekDate({ now: el[0], dayOfWeek: el[1], hours: el[2], minutes: el[3] })).toEqual(new Date(el[4])));
});

it(`${getNextTriggerDate.name} should work`, () => {
  (
    [
      ["2022-11-20T07:00:00.000Z", 7, 0, [4, 0], "2022-11-20T07:00:00.000Z"],
      ["2022-11-20T07:00:00.001Z", 7, 0, [4, 0], "2022-11-24T07:00:00.000Z"],
      ["2022-11-20T07:00:00.000Z", 7, 0, [4, 6], "2022-11-24T07:00:00.000Z"],
      ["2022-11-20T07:01:00.000Z", 7, 1, [3, 5], "2022-11-23T07:01:00.000Z"],
      ["2022-11-20T07:01:00.000Z", 7, 1, [5, 3], "2022-11-23T07:01:00.000Z"],
      ["2022-11-20T07:00:59.999Z", 7, 1, [0], "2022-11-20T07:01:00.000Z"],
      ["2022-11-20T07:01:00.000Z", 7, 1, [0], "2022-11-20T07:01:00.000Z"],
      ["2022-11-20T07:00:00.000Z", 7, 0, undefined, "2022-11-20T07:00:00.000Z"],
      ["2022-11-20T07:00:00.001Z", 7, 0, undefined, "2022-11-21T07:00:00.000Z"],
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
  const [activeOneTimeAlarm, activeOneTimeAlarmCopy] = alarmItemGenerator({ type: "alarmOneTime", status: "active" });

  const [inactiveOneTimeAlarm, inactiveOneTimeAlarmCopy] = alarmItemGenerator({ type: "alarmOneTime", status: "inactive" });
  const [missedOneTimeAlarm, missedOneTimeAlarmCopy] = alarmItemGenerator({ type: "alarmOneTime", status: "missed" });
  const [ringingOneTimeAlarm, ringingOneTimeAlarmCopy] = alarmItemGenerator({ type: "alarmOneTime", status: "ringing" });
  const [silencedOneTimeAlarm, silencedOneTimeAlarmCopy] = alarmItemGenerator({ type: "alarmOneTime", status: "silenced" });
  const [activeRepeatAlarm, activeRepeatAlarmCopy] = alarmItemGenerator({ type: "alarmRepeat", status: "active" });
  const [inactiveRepeatAlarm, inactiveRepeatAlarmCopy] = alarmItemGenerator({ type: "alarmRepeat", status: "inactive" });
  const [ringingRepeatAlarm, ringingRepeatAlarmCopy] = alarmItemGenerator({ type: "alarmRepeat", status: "ringing" });
  const [silencedRepeatAlarm, silencedRepeatAlarmCopy] = alarmItemGenerator({ type: "alarmRepeat", status: "silenced" });

  it("should return same item with object equality and same values", () => {
    (
      [
        // now, alarmToleranceInMs, reminderBeforeInMs
        [activeOneTimeAlarm, activeOneTimeAlarmCopy, "2022-11-20T06:59:59.999Z", 0, 0],
        [activeOneTimeAlarm, activeOneTimeAlarmCopy, "2022-11-20T07:00:00.001Z", 0, 0],
        [activeOneTimeAlarm, activeOneTimeAlarmCopy, "2022-11-20T06:59:59.999Z", 60000, 0],
        [activeOneTimeAlarm, activeOneTimeAlarmCopy, "2022-11-20T07:01:00.001Z", 60000, 0],

        [inactiveOneTimeAlarm, inactiveOneTimeAlarmCopy, "2022-11-20T06:59:59.999Z", 60000, 0],
        [inactiveOneTimeAlarm, inactiveOneTimeAlarmCopy, "2022-11-20T07:00:00.000Z", 60000, 0],
        [inactiveOneTimeAlarm, inactiveOneTimeAlarmCopy, "2022-11-20T07:00:00.001Z", 60000, 0],

        [missedOneTimeAlarm, missedOneTimeAlarmCopy, "2022-11-20T06:59:59.999Z", 60000, 0],
        [missedOneTimeAlarm, missedOneTimeAlarmCopy, "2022-11-20T07:01:00.001Z", 60000, 0],

        [ringingOneTimeAlarm, ringingOneTimeAlarmCopy, "2022-11-20T07:00:00.000Z", 60000, 0],
        [ringingOneTimeAlarm, ringingOneTimeAlarmCopy, "2022-11-20T07:01:00.000Z", 60000, 0],

        [silencedOneTimeAlarm, silencedOneTimeAlarmCopy, "2022-11-20T07:00:00.000Z", 60000, 0],
        [silencedOneTimeAlarm, silencedOneTimeAlarmCopy, "2022-11-20T07:01:00.000Z", 60000, 0],

        [activeRepeatAlarm, activeRepeatAlarmCopy, "2022-11-20T06:59:59.999Z", 0, 0],
        [activeRepeatAlarm, activeRepeatAlarmCopy, "2022-11-20T07:00:00.001Z", 0, 0],
        [activeRepeatAlarm, activeRepeatAlarmCopy, "2022-11-20T06:59:59.999Z", 60000, 0],
        [activeRepeatAlarm, activeRepeatAlarmCopy, "2022-11-20T07:01:00.001Z", 60000, 0],

        [ringingRepeatAlarm, ringingRepeatAlarmCopy, "2022-11-20T07:00:00.000Z", 60000, 0],
        [ringingRepeatAlarm, ringingRepeatAlarmCopy, "2022-11-20T07:01:00.000Z", 60000, 0],
      ] as const
    ).forEach((el) => {
      // expect object reference equality
      expect(getNextStateItem(el[0], el[2], { alarmToleranceInMs: el[3], reminderBeforeInMs: el[4] })).toBe(el[0]);

      // expect equality of values between copy and original
      expect(el[0]).toEqual(el[1]);
    });
  });

  it("should return item with expected status", () => {
    (
      [
        // alarm, now, alarmToleranceInMs, reminderBeforeInMs, expectedStatus
        // testing reminder/tolerance
        [activeOneTimeAlarm, "2022-11-20T06:59:59.999Z", 0, 0, "active"],
        [activeOneTimeAlarm, "2022-11-20T07:00:00.000Z", 0, 0, "ringing"],
        [activeOneTimeAlarm, "2022-11-20T07:00:00.001Z", 0, 0, "active"],
        [activeOneTimeAlarm, "2022-11-20T06:59:29.999Z", 60000, 30000, "active"],
        [activeOneTimeAlarm, "2022-11-20T06:59:30.000Z", 60000, 30000, "ringing"],
        [activeOneTimeAlarm, "2022-11-20T07:00:30.000Z", 60000, 30000, "ringing"],
        [activeOneTimeAlarm, "2022-11-20T07:00:30.001Z", 60000, 30000, "active"],

        [activeOneTimeAlarm, "2022-11-20T06:59:59.999Z", 60000, 0, "active"],
        [activeOneTimeAlarm, "2022-11-20T07:00:00.000Z", 60000, 0, "ringing"],
        [activeOneTimeAlarm, "2022-11-20T07:01:00.000Z", 60000, 0, "ringing"],
        [activeOneTimeAlarm, "2022-11-20T07:01:00.001Z", 60000, 0, "active"],

        [inactiveOneTimeAlarm, "2022-11-20T06:59:59.999Z", 60000, 0, "inactive"],
        [inactiveOneTimeAlarm, "2022-11-20T07:00:00.000Z", 60000, 0, "inactive"],
        [inactiveOneTimeAlarm, "2022-11-20T07:00:00.001Z", 60000, 0, "inactive"],

        [missedOneTimeAlarm, "2022-11-20T06:59:59.999Z", 60000, 0, "missed"],
        [missedOneTimeAlarm, "2022-11-20T07:00:00.000Z", 60000, 0, "inactive"],
        [missedOneTimeAlarm, "2022-11-20T07:01:00.000Z", 60000, 0, "inactive"],
        [missedOneTimeAlarm, "2022-11-20T07:01:00.001Z", 60000, 0, "missed"],

        [ringingOneTimeAlarm, "2022-11-20T06:59:59.999Z", 60000, 0, "inactive"],
        [ringingOneTimeAlarm, "2022-11-20T07:00:00.000Z", 60000, 0, "ringing"],
        [ringingOneTimeAlarm, "2022-11-20T07:01:00.000Z", 60000, 0, "ringing"],
        [ringingOneTimeAlarm, "2022-11-20T07:01:00.001Z", 60000, 0, "inactive"],

        [silencedOneTimeAlarm, "2022-11-20T06:59:59.999Z", 60000, 0, "inactive"],
        [silencedOneTimeAlarm, "2022-11-20T07:00:00.000Z", 60000, 0, "silenced"],
        [silencedOneTimeAlarm, "2022-11-20T07:01:00.000Z", 60000, 0, "silenced"],
        [silencedOneTimeAlarm, "2022-11-20T07:01:00.001Z", 60000, 0, "inactive"],

        [activeRepeatAlarm, "2022-11-20T06:59:59.999Z", 60000, 0, "active"],
        [activeRepeatAlarm, "2022-11-20T07:00:00.000Z", 60000, 0, "ringing"],
        [activeRepeatAlarm, "2022-11-20T07:01:00.000Z", 60000, 0, "ringing"],
        [activeRepeatAlarm, "2022-11-23T07:01:00.000Z", 60000, 0, "ringing"],
        [activeRepeatAlarm, "2022-11-20T07:01:00.001Z", 60000, 0, "active"],
        [activeRepeatAlarm, "2022-11-21T07:01:00.000Z", 60000, 0, "active"],
        [activeRepeatAlarm, "2022-11-22T07:01:00.000Z", 60000, 0, "active"],

        [inactiveRepeatAlarm, "2022-11-20T06:59:59.999Z", 60000, 0, "inactive"],
        [inactiveRepeatAlarm, "2022-11-20T07:00:00.000Z", 60000, 0, "inactive"],
        [inactiveRepeatAlarm, "2022-11-20T07:00:00.001Z", 60000, 0, "inactive"],

        [ringingRepeatAlarm, "2022-11-20T06:59:59.999Z", 60000, 0, "active"],
        [ringingRepeatAlarm, "2022-11-20T07:00:00.000Z", 60000, 0, "ringing"],
        [ringingRepeatAlarm, "2022-11-20T07:01:00.000Z", 60000, 0, "ringing"],
        [ringingRepeatAlarm, "2022-11-23T07:01:00.000Z", 60000, 0, "ringing"],
        [ringingRepeatAlarm, "2022-11-20T07:01:00.001Z", 60000, 0, "active"],
        [ringingRepeatAlarm, "2022-11-21T07:01:00.000Z", 60000, 0, "active"],
        [ringingRepeatAlarm, "2022-11-22T07:01:00.000Z", 60000, 0, "active"],
      ] as const
    ).forEach((el) => expect(getNextStateItem(el[0], el[1], { alarmToleranceInMs: el[2], reminderBeforeInMs: el[3] })).toEqual({ ...el[0], status: el[4] }));
  });
});
