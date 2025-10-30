import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { ISchedule } from '../types/types';


const DATA_DIR =
  process.env.SCHED_DATA_DIR || path.resolve(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'schedules.json');

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, '[]', 'utf8');
  }
}

export async function listSchedules(): Promise<ISchedule[]> {
  await ensureFile();
  const raw = await fs.readFile(FILE, 'utf8');
  return JSON.parse(raw) as ISchedule[];
}

export async function saveSchedules(items: ISchedule[]): Promise<void> {
  await ensureFile();
  // write atomically
  const tmp = FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(items, null, 2), 'utf8');
  await fs.rename(tmp, FILE);
}

export async function createSchedule(
  data: Omit<ISchedule, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<ISchedule> {
  const items = await listSchedules();
  const now = new Date().toISOString();
  const item: ISchedule = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  items.push(item);
  await saveSchedules(items);
  return item;
}

export async function updateSchedule(
  id: string,
  patch: Partial<ISchedule>,
): Promise<ISchedule | null> {
  const items = await listSchedules();
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  items[idx] = { ...items[idx], ...patch, updatedAt: now };
  await saveSchedules(items);
  return items[idx];
}

export async function removeSchedule(id: string): Promise<boolean> {
  const items = await listSchedules();
  const next = items.filter((i) => i.id !== id);
  if (next.length === items.length) return false;
  await saveSchedules(next);
  return true;
}
