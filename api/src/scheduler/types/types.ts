export interface ISchedule {
  id: string;
  expr: string;        // expresión CRON
  target: string;      // nombre/id del contenedor
  enabled: boolean;    // si está activo
  timezone?: string;   // p.ej. 'America/Bogota'
  createdAt?: string;  // ISO
  updatedAt?: string;  // ISO
}