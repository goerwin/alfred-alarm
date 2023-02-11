import { z } from 'zod';

const CommonDataItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  createdAt: z.date(),
  pid: z.number().optional(),
});

const statusesSchema = z.enum([
  'active',
  'inactive',
  'ringing',
  'silenced',
  'missed',
]);

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
  hours: hoursSchema,
  minutes: minutesSchema,
});

const AlarmRepeatSchema = AlarmOneTimeSchema.extend({
  type: z.literal('alarmRepeat'),
  status: statusesSchema.exclude(['missed']),
  isoDays: z.array(z.number().min(0).max(6)).nonempty(),
  hours: hoursSchema,
  minutes: minutesSchema,
});

export const DataSchema = z.object({
  alarmReminderInMins: z.number().optional(),
  maxItems: z.number().optional(),
  alarmFilePath: z.string().optional(),
  items: z.array(z.union([TimerSchema, AlarmOneTimeSchema, AlarmRepeatSchema])),
  bgProcess: z.object({ pid: z.number(), startDate: z.date() }).optional(),
});

const ommitedKeysForNewAlarmOrTimer = {
  id: true,
  status: true,
  pid: true,
} as const;

const NewAlarmOrTimerAttrsSchema = z.discriminatedUnion('type', [
  AlarmOneTimeSchema.omit(ommitedKeysForNewAlarmOrTimer),
  AlarmRepeatSchema.omit(ommitedKeysForNewAlarmOrTimer),
  TimerSchema.omit(ommitedKeysForNewAlarmOrTimer),
]);

export type Data = z.infer<typeof DataSchema>;
type AlarmOneTime = z.infer<typeof AlarmOneTimeSchema>;
type AlarmRepeat = z.infer<typeof AlarmRepeatSchema>;
type Timer = z.infer<typeof TimerSchema>;
export type DataItem = Data['items'][number];
export type NewAlarmOrTimerAttrs = z.infer<typeof NewAlarmOrTimerAttrsSchema>;
