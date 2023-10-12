import path from 'path';
import shell from 'shelljs';
import * as helpersProcess from './helpers/helpersProcess';
import { getAlarmPath } from './helpers/general';

const alarmFilePath = getAlarmPath()

helpersProcess.showNotification(process.env.title ?? '');

// Gotta be async so that if the main process is killed,
// this can exit as well.
// It this were synchronous, even if you kill the process,
// this won't get the kill signal until it finishes.
// In other words, use the synchronous version only on fast
// tasks or ones you don't care about if they continue
// running in the background as zombies
shell.exec(`afplay "${alarmFilePath}"`, { async: true });
