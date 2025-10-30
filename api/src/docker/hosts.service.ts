import { Injectable } from '@nestjs/common';
import { HOSTS, DockerHostConfig } from './registry';

type PublicHost = Pick<DockerHostConfig, 'id' | 'name' | 'type' | 'enabled'>;

@Injectable()
export class HostsService {
  list(): PublicHost[] {
    // Sanitiza: no expongas certPath ni URLs internas si no quieres
    return HOSTS.filter(h => h.enabled).map(h => ({
      id: h.id,
      name: h.name,
      type: h.type,
      enabled: h.enabled,
    }));
  }
}
