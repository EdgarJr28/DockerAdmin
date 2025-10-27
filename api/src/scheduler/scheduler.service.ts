import { Injectable, OnModuleInit } from '@nestjs/common';
import cron from 'node-cron';
import { DockerService } from '../docker/docker.service.js';


@Injectable()
export class SchedulerService implements OnModuleInit {
    constructor(private readonly docker: DockerService) { }


    onModuleInit() {
        const expr = process.env.RESTART_CRON;
        const target = process.env.RESTART_CONTAINER;
        if (expr && target) {
            cron.schedule(expr, async () => {
                try {
                    await this.docker.restart(target);
                    console.log(`[cron] restarted ${target} at`, new Date().toISOString());
                } catch (e) {
                    console.error('[cron] restart failed:', e);
                }
            });
            console.log(`[cron] scheduled restart of ${target} with "${expr}"`);
        }
    }
}