export type CronMode = 'everyMinutes' | 'everyHours' | 'daily' | 'weekly' | 'monthly';

export type CronInput =
  | { mode: 'everyMinutes'; n: number }                       // cada n minutos (1-59)
  | { mode: 'everyHours'; n: number; minute?: number }        // cada n horas (1-23), en el minuto X (default 0)
  | { mode: 'daily'; hour: number; minute: number }           // todos los días a HH:mm
  | { mode: 'weekly'; hour: number; minute: number; days: number[] } // días 0-6 (0=Domingo)
  | { mode: 'monthly'; hour: number; minute: number; day: number };  // día 1-31

/** Normaliza (0-59, 0-23, etc.) */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(n)));
}

/** Convierte "HH:mm" a {hour, minute} */
export function parseTime(t: string): { hour: number; minute: number } {
  const [h, m] = t.split(':').map((x) => Number(x));
  return { hour: clamp(h || 0, 0, 23), minute: clamp(m || 0, 0, 59) };
}

/** Construye CRON (5 campos) desde selección de UI */
export function toCron(input: CronInput): string {
  switch (input.mode) {
    case 'everyMinutes': {
      const n = clamp(input.n, 1, 59);
      return `*/${n} * * * *`;
    }
    case 'everyHours': {
      const n = clamp(input.n, 1, 23);
      const minute = clamp(input.minute ?? 0, 0, 59);
      return `${minute} */${n} * * *`;
    }
    case 'daily': {
      const minute = clamp(input.minute, 0, 59);
      const hour = clamp(input.hour, 0, 23);
      return `${minute} ${hour} * * *`;
    }
    case 'weekly': {
      const minute = clamp(input.minute, 0, 59);
      const hour = clamp(input.hour, 0, 23);
      const days = (input.days?.length ? input.days : [0]) // por defecto domingo
        .map((d) => clamp(d, 0, 6))
        .sort((a, b) => a - b)
        .join(',');
      return `${minute} ${hour} * * ${days}`;
    }
    case 'monthly': {
      const minute = clamp(input.minute, 0, 59);
      const hour = clamp(input.hour, 0, 23);
      const day = clamp(input.day, 1, 31);
      return `${minute} ${hour} ${day} * *`;
    }
    default:
      return '* * * * *';
  }
}
