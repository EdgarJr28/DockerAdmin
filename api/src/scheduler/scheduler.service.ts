import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import cron, { type ScheduledTask } from 'node-cron';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

type TargetKind = 'container' | 'url' | 'script';

type ScheduleItem = {
  id: string;
  hostId: string; // ← NUEVO: servidor Docker
  expr: string;
  target: string; // p.ej. nombre del contenedor o URL/script
  targetKind?: TargetKind; // ← NUEVO: clase de objetivo (extensible)
  enabled: boolean;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly items = new Map<string, ScheduleItem>();
  private readonly tasks = new Map<string, ScheduledTask>();

  // host por defecto si un item viejo no lo trae
  private readonly DEFAULT_HOST_ID =
    process.env.DEFAULT_DOCKER_HOST_ID || 'local';

  // Ruta configurable desde variable de entorno
  private readonly filePath: string = process.env.SCHEDULER_STORE
    ? path.resolve(process.env.SCHEDULER_STORE)
    : path.resolve(process.cwd(), 'schedules.json');

  async onModuleInit() {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        fs.writeFileSync(this.filePath, '[]');
        console.log(`[CRON] Archivo creado vacío en ${this.filePath}`);
      }

      const content = fs.readFileSync(this.filePath, 'utf8');
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        // Migración suave: garantiza hostId/targetKind
        const restored: ScheduleItem[] = data.map((raw: any) => {
          const item: ScheduleItem = {
            id: raw.id ?? randomUUID(),
            hostId: raw.hostId ?? this.DEFAULT_HOST_ID, // ← migrate
            expr: raw.expr,
            target: raw.target,
            targetKind: raw.targetKind ?? 'container', // ← migrate
            enabled: raw.enabled ?? true,
            timezone: raw.timezone ?? 'America/Bogota',
            createdAt: raw.createdAt ?? new Date().toISOString(),
            updatedAt: raw.updatedAt ?? new Date().toISOString(),
          };
          (item as any).restored = true;
          return item;
        });

        for (const item of restored) {
          this.recreateTask(item);
          this.items.set(item.id, item);
        }
        console.log(
          `[CRON] ${restored.length} tareas restauradas desde ${this.filePath}`,
        );
      } else {
        console.warn(
          `[CRON] Archivo ${this.filePath} no contiene un arreglo válido, se ignorará`,
        );
      }
    } catch (err) {
      console.error('[CRON] Error al cargar tareas:', err);
    }
  }

  /** Guarda las tareas en disco */
  private saveToDisk() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const all = Array.from(this.items.values());
      fs.writeFileSync(this.filePath, JSON.stringify(all, null, 2));
    } catch (err) {
      console.error('[CRON] Error al guardar tareas:', err);
    }
  }

  /** ====================== LEGACY (sin host en ruta) ====================== */

  /** Crea una nueva tarea (legacy): si no trae hostId, usa DEFAULT_HOST_ID */
  create(dto: {
    expr: string;
    target: string;
    timezone?: string;
    enabled?: boolean;
    hostId?: string;
    targetKind?: TargetKind;
  }): ScheduleItem {
    const hostId = dto.hostId ?? this.DEFAULT_HOST_ID;
    return this.createForHost(hostId, dto);
  }

  /** Lista todas las tareas (todos los hosts) */
  list(): ScheduleItem[] {
    return Array.from(this.items.values());
  }

  /** Obtiene una tarea por ID (sin validar host) */
  get(id: string): ScheduleItem {
    const it = this.items.get(id);
    if (!it) throw new NotFoundException('Schedule not found');
    return it;
  }

  /** Actualiza una tarea (sin validar host) */
  update(id: string, dto: Partial<ScheduleItem>): ScheduleItem {
    const item = this.items.get(id);
    if (!item) throw new NotFoundException('Tarea no encontrada');

    // parar la tarea actual si existe
    const oldTask = this.tasks.get(id);
    if (oldTask) oldTask.stop();

    const updated: ScheduleItem = {
      ...item,
      ...dto,
      // nunca dejes hostId vacío; si viene undefined, conserva
      hostId: dto.hostId ?? item.hostId,
      targetKind: dto.targetKind ?? item.targetKind ?? 'container',
      updatedAt: new Date().toISOString(),
    };
    this.items.set(id, updated);

    const task = this.recreateTask(updated);
    this.tasks.set(id, task);
    this.saveToDisk();

    console.log(`[CRON] Tarea ${id} actualizada`);
    return updated;
  }

  enable(id: string) {
    const task = this.tasks.get(id);
    if (!task) throw new NotFoundException('Tarea no encontrada');
    task.start();

    const item = this.items.get(id);
    if (item) {
      item.enabled = true;
      item.updatedAt = new Date().toISOString();
      this.saveToDisk();
    }

    console.log(`[CRON] Tarea ${id} habilitada`);
    return { ok: true };
  }

  disable(id: string) {
    const task = this.tasks.get(id);
    if (!task) throw new NotFoundException('Tarea no encontrada');
    task.stop();

    const item = this.items.get(id);
    if (item) {
      item.enabled = false;
      item.updatedAt = new Date().toISOString();
      this.saveToDisk();
    }

    console.log(`[CRON] Tarea ${id} deshabilitada`);
    return { ok: true };
  }

  remove(id: string) {
    const task = this.tasks.get(id);
    if (task) {
      task.stop();
      this.tasks.delete(id);
    }

    const existed = this.items.delete(id);
    if (!existed) throw new NotFoundException('Schedule not found');

    this.saveToDisk();
    console.log(`[CRON] Tarea ${id} eliminada`);
    return { ok: true };
  }

  /** ====================== HOST-AWARE (con :hostId en ruta) ====================== */

  /** Lista tareas de un solo host */
  listByHost(hostId: string): ScheduleItem[] {
    return Array.from(this.items.values()).filter((it) => it.hostId === hostId);
  }

  /** Crea tarea fijando hostId desde la ruta */
  createForHost(
    hostId: string,
    dto: {
      expr: string;
      target: string;
      timezone?: string;
      enabled?: boolean;
      targetKind?: TargetKind;
    },
  ): ScheduleItem {
    const { expr, target, timezone = 'America/Bogota' } = dto;
    const id = randomUUID();
    const now = new Date().toISOString();

    const item: ScheduleItem = {
      id,
      hostId,
      expr,
      target,
      targetKind: dto.targetKind ?? 'container',
      enabled: dto.enabled ?? true,
      timezone,
      createdAt: now,
      updatedAt: now,
    };

    const task = this.recreateTask(item);
    this.items.set(id, item);
    this.tasks.set(id, task);
    this.saveToDisk();

    console.log(`[CRON] Nueva tarea @${hostId} → ${item.target} (${expr})`);
    return item;
  }

  /** Obtiene una tarea verificando que pertenece a ese host */
  getInHost(hostId: string, id: string): ScheduleItem {
    const it = this.get(id);
    if (it.hostId !== hostId) throw new NotFoundException('Schedule not found');
    return it;
  }

  /** Actualiza una tarea dentro de un host (valida pertenencia) */
  updateInHost(
    hostId: string,
    id: string,
    dto: Partial<ScheduleItem>,
  ): ScheduleItem {
    const it = this.getInHost(hostId, id);
    // bloquear cambio de hostId por esta ruta
    const sanitized: Partial<ScheduleItem> = { ...dto, hostId: it.hostId };
    return this.update(id, sanitized);
  }

  enableInHost(hostId: string, id: string) {
    this.getInHost(hostId, id); // valida pertenencia
    return this.enable(id);
  }

  disableInHost(hostId: string, id: string) {
    this.getInHost(hostId, id);
    return this.disable(id);
  }

  removeInHost(hostId: string, id: string) {
    this.getInHost(hostId, id);
    return this.remove(id);
  }

  /** ====================== RUNNER ====================== */
  /** Crea o recrea una tarea cron a partir del objeto ScheduleItem */
  private recreateTask(item: ScheduleItem): ScheduledTask {
    const task = cron.schedule(
      item.expr,
      async () => {
        // Aquí decides QUÉ hacer con la tarea
        // Puedes branching por targetKind:
        // - 'container': invocar DockerService con hostId + target (p.ej. restart)
        // - 'url': fetch/POST a una URL
        // - 'script': ejecutar un comando local (con sandbox/cola segura)
        //
        // TODO: Inyectar e invocar tu "executor" real (DockerService / HttpService / etc.)
        console.log(
          `[CRON] Ejecutando @${item.hostId} kind=${item.targetKind ?? 'container'} target=${item.target}`,
        );
      },
      { scheduled: false, timezone: item.timezone || 'America/Bogota' },
    );

    if (item.enabled) task.start();
    return task;
  }
}
