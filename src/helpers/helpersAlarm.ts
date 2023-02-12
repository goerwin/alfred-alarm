import crypto from 'crypto';
import * as helpersProcess from './helpersProcess';
import { getData, setData } from './general';
import { DataItem, NewAlarmOrTimerAttrsSchema } from './schemas';

export function createAlarmOrTimer(attrs: unknown) {
  const data = getData();
  const MAX_ITEMS = data.maxItems || 50;

  if (data.items.length >= MAX_ITEMS) {
    const errorMsg = `Error: Too many items. Max: ${MAX_ITEMS}`;
    helpersProcess.showNotification(errorMsg);
    throw new Error(errorMsg);
  }

  const parsedAttrs = NewAlarmOrTimerAttrsSchema.parse(attrs);
  const id = crypto.randomUUID();
  const now = new Date();
  const title = parsedAttrs.title.trim();
  const newItem: DataItem = {
    ...parsedAttrs,
    id,
    title,
    createdAt: now.toISOString(),
    status: 'active',
  };

  setData({ ...data, items: [newItem, ...data.items] });
  return newItem;
}

function silenceAlarm(id: string) {
  const data = getData();
  const item = data.items.find((el) => el.id === id);
  const status = item?.status;
  const pid = item?.pid;

  if (status !== 'ringing') return;
  if (!pid) return;

  if (helpersProcess.isFamilyProcess(pid)) helpersProcess.killProcessesWithPPIDEqualToPID(pid);

  setData({
    ...data,
    items: data.items.map((el) => (el.id !== id ? el : { ...el, status: 'silenced' })),
  });
}

export function cancelAlarm(id: string) {
  const data = getData();
  const item = data.items.find((el) => el.id === id);

  if (!item) return;

  const status = item?.status;

  if (!['active', 'ringing'].includes(status)) return;

  silenceAlarm(id);

  setData({
    ...data,
    items: data.items.map((el) => (el.id !== id ? el : { ...el, status: 'inactive' })),
  });
}

export function deleteAlarm(id: string) {
  const data = getData();
  cancelAlarm(id);
  setData({ ...data, items: data.items.filter((el) => el.id !== id) });
}

export function cancelOrRestartOrSilenceAlarm(id: string) {
  const data = getData();
  const item = data.items.find((el) => el.id === id);

  if (!item) return;

  const { status } = item;
  if (status === 'active') cancelAlarm(id);
  else if (status === 'ringing') silenceAlarm(id);
  else {
    deleteAlarm(id);
    createAlarmOrTimer({ ...item });
  }
}

export function removeAllAlarms() {
  getData().items.forEach((el) => deleteAlarm(el.id));
}

export function silenceAllAlarms() {
  getData().items.forEach((el) => silenceAlarm(el.id));
}

export function cancelAllAlarms() {
  getData().items.forEach((el) => cancelAlarm(el.id));
}
