const FLY_API_TOKEN = process.env.FLY_API_TOKEN;
const FLY_ORG_SLUG = process.env.FLY_ORG_SLUG;
const FLY_ORG_TOKEN = process.env.FLY_ORG_TOKEN;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const APP_NAME = "daxthebot-soft-shape-4207";
console.log(
  "Token check — starts with FlyV1:",
  FLY_ORG_TOKEN?.startsWith("FlyV1"),
  "| length:",
  FLY_ORG_TOKEN?.length,
);
async function queryMetric(promQuery) {
  try {
    const url = `https://api.fly.io/prometheus/${FLY_ORG_SLUG}/api/v1/query`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `${FLY_ORG_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `query=${encodeURIComponent(promQuery)}`,
    });
    // const text = await res.text();

    const data = await res.json();

    if (!res.ok) {
      console.error(
        `queryMetric failed for "${promQuery}" — status ${res.status}: ${JSON.stringify(data)}`,
      );
      return null;
    }

    const value = data?.data?.result?.[0]?.value?.[1];
    return value !== undefined ? Number(value) : null;
  } catch (err) {
    console.error(`queryMetric error for "${promQuery}":`, err.message);
    return null;
  }
}

async function checkStatus() {
  const res = await fetch(
    `https://api.machines.dev/v1/apps/${APP_NAME}/machines`,
    {
      headers: { Authorization: `${FLY_API_TOKEN}` },
    },
  );

  function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  }

  const machines = await res.json();
  console.log("Raw response:", JSON.stringify(machines, null, 2));
  console.log("Response status:", res.status);
  const machineLines = machines.map((m) => {
    const uptimeMs = Date.now() - new Date(m.updated_at).getTime();
    return `**${m.region}** — ${m.state} — ${formatDuration(uptimeMs)}`;
  });

  const memUsedQuery = `sum(REAL_MEM_USED_METRIC_NAME{app="${APP_NAME}"})`;
  const memTotalQuery = `sum(REAL_MEM_TOTAL_METRIC_NAME{app="${APP_NAME}"})`;
  const diskUsedQuery = `sum(REAL_DISK_USED_METRIC_NAME{app="${APP_NAME}"})`;
  const diskTotalQuery = `sum(REAL_DISK_TOTAL_METRIC_NAME{app="${APP_NAME}"})`;
  const cpuQuery = `100 * (1 - (sum(rate(fly_instance_cpu{app="${APP_NAME}", mode="idle"}[5m])) / sum(rate(fly_instance_cpu{app="${APP_NAME}"}[5m]))))`;

  const [memUsedBytes, memTotalBytes, cpuPercent, diskUsedBytes,diskTotalBytes] = await Promise.all([
    queryMetric(memUsedQuery),
    queryMetric(memTotalQuery),
    queryMetric(cpuQuery),
    queryMetric(diskUsedQuery),
    queryMetric(diskTotalQuery),
  ]);

  const memLine =
    memUsedBytes !== null && memTotalBytes !== null
      ? `RAM: ${(memUsedBytes / 1024 / 1024).toFixed(0)}MB / ${(memTotalBytes / 1024 / 1024).toFixed(0)}MB`
      : "RAM: unavailable";

  const memPercentage =
    memUsedBytes !== null && memTotalBytes !== null
      ? `RAM usage: ${((memUsedBytes / memTotalBytes) * 100).toFixed(1)}%`
      : `RAM usage: unavailable`;

  const diskLine =
    diskUsedBytes !== null && diskTotalBytes !== null
      ? `Disk: ${(diskUsedBytes / 1024 / 1024 / 1024).toFixed(1)}GB / ${(diskTotalBytes / 1024 / 1024 / 1024).toFixed(1)}GB`
      : "Disk: unavailable";
  
  const cpuLine =
    cpuPercent !== null ? `CPU: ${cpuPercent.toFixed(1)}%` : "CPU: unavailable";

  const message = [
    "📊 **Dax status**",
    ...machineLines,
    memLine,
    memPercentage,
    cpuLine,
    diskLine,
  ].join("\n");

  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message }),
  });
}

checkStatus();
