// libs/parse-stats.ts
export function parseStats(s: any) {
  const cpuTotal = s?.cpu_stats?.cpu_usage?.total_usage ?? 0;
  const cpuTotalPrev = s?.precpu_stats?.cpu_usage?.total_usage ?? 0;
  const system = s?.cpu_stats?.system_cpu_usage ?? 0;
  const systemPrev = s?.precpu_stats?.system_cpu_usage ?? 0;

  const cpuDelta = cpuTotal - cpuTotalPrev;
  const systemDelta = system - systemPrev;
  const cpus =
    s?.cpu_stats?.online_cpus ??
    s?.cpu_stats?.cpu_usage?.percpu_usage?.length ??
    1;

  const cpuPercent =
    systemDelta > 0 && cpuDelta > 0 ? (cpuDelta / systemDelta) * cpus * 100 : 0;

  const memUsage = s?.memory_stats?.usage ?? 0;
  const memLimit = s?.memory_stats?.limit || 1;
  const memPercent = (memUsage / memLimit) * 100;

  const networks = s?.networks || {};
  let rxBytes = 0,
    txBytes = 0;
  for (const k of Object.keys(networks)) {
    rxBytes += networks[k]?.rx_bytes || 0;
    txBytes += networks[k]?.tx_bytes || 0;
  }

  return {
    cpuPercent,
    memUsage,
    memLimit,
    memPercent,
    rxBytes,
    txBytes,
    pids: s?.pids_stats?.current ?? 0,
    read: s?.read ?? null,
  };
}
