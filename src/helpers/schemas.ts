import { z } from 'zod';

const CommonDataItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string().datetime(),
  pid: z.number().optional(),
});

const statusesSchema = z.enum(['active', 'inactive', 'ringing', 'silenced', 'missed']);

const hoursSchema = z.number().min(0).max(23);
const minutesSchema = z.number().min(0).max(59);

const TimerSchema = CommonDataItemSchema.extend({
  type: z.literal('timer'),
  status: statusesSchema,
  minutes: z.number().positive(),
});

const AlarmOneTimeSchema = CommonDataItemSchema.extend({
  type: z.literal('alarmOneTime'),
  status: statusesSchema,
  isoHours: hoursSchema,
  isoMinutes: minutesSchema,
});

const AlarmRepeatSchema = AlarmOneTimeSchema.extend({
  type: z.literal('alarmRepeat'),
  status: statusesSchema.exclude(['missed']),
  isoWeekDays: z.array(z.number().min(0).max(6)).nonempty(),
});

export const DataSchema = z.object({
  alarmReminderInMins: z.number().optional(),
  alarmToleranceInMins: z.number().optional(),
  maxItems: z.number().optional(),
  items: z.array(z.union([TimerSchema, AlarmOneTimeSchema, AlarmRepeatSchema])),
  bgProcess: z.object({ pid: z.number(), createdAt: z.string().datetime() }).optional(),
});

const ommitedKeysForNewAlarmOrTimer = {
  id: true,
  status: true,
  pid: true,
} as const;

export const NewAlarmOrTimerAttrsSchema = z.discriminatedUnion('type', [
  AlarmOneTimeSchema.omit(ommitedKeysForNewAlarmOrTimer),
  AlarmRepeatSchema.omit(ommitedKeysForNewAlarmOrTimer),
  TimerSchema.omit(ommitedKeysForNewAlarmOrTimer),
]);

export type Data = z.infer<typeof DataSchema>;
export type NewAlarmOrTimerAttrs = z.infer<typeof NewAlarmOrTimerAttrsSchema>;
export type DataItem = Data['items'][number];

export type AlfredItem = {
  title: string;
  valid?: boolean;
  subtitle?: string;
  mods?: { [key: string]: any };
  match?: string;
  icon?: { path: string };
  variables?: { [key: string]: any };
  arg?: string;
};
