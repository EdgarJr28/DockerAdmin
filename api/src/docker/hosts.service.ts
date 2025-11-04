// api/src/docker/hosts.service.ts
import { Injectable } from '@nestjs/common';
import { HOSTS, DockerHostConfig } from './registry';

type PublicHost = Pick<DockerHostConfig, 'id' | 'name' | 'type' | 'enabled'>;

@Injectable()
export class HostsService {
  list(): PublicHost[] {
    return HOSTS.filter((h) => h.enabled).map((h) => ({
      id: h.id,
      name: h.name,
      type: h.type,
      enabled: h.enabled,
    }));
  }

  findOne(id: string): DockerHostConfig | undefined {
    return HOSTS.find((h) => h.id === id && h.enabled);
  }

  /** Devuelve el host marcado como default o el primero habilitado */
  getDefault(): DockerHostConfig | undefined {
    const explicit = HOSTS.find((h) => (h as any).default === true && h.enabled);
    if (explicit) return explicit;
    return HOSTS.find((h) => h.enabled);
  }
}
