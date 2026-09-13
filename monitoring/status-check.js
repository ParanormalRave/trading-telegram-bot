const FLY_API_TOKEN = process.env.FLY_API_TOKEN;
const FLY_ORG_SLUG = process.env.FLY_ORG_SLUG;
const FLY_ORG_TOKEN = process.env.FLY_ORG_TOKEN;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const APP_NAME = `daxthebot-soft-shape-4207`;

async function queryMetric(promQuery) {
  const url = `https://api.fly.io/prometheus/${FLY_ORG_SLUG}/api/v1/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FLY_ORG_TOKEN}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `query=${encodeURIComponent(promQuery)}`,
  });
  const data = await res.json();
  const value = data?.data?.result?.[0]?.value?.[1];
  return value !== undefined ? Number(value) : null;
}

async function checkStatus() {
  const res = await fetch(
    `https://api.machines.dev/v1/apps/${APP_NAME}/machines`,
    {
      headers: { Authorization: `Bearer ${FLY_API_TOKEN}` },
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

  const [memUsedBytes, memTotalBytes,cpuPercent] = await Promise.all([
    queryMetric(`fly_instance_memory_mem_used{app="${APP_NAME}"}`),
    queryMetric(`fly_instance_memory_mem_total{app="${APP_NAME}"}`),
    queryMetric(`fly_instance_cpu{app="${APP_NAME}"}`),
  ]);
  
  const memLine =
    memUsedBytes && memTotalBytes
      ? `RAM: ${(memUsedBytes / 1024 / 1024).toFixed(0)}MB / ${(memTotalBytes / 1024 / 1024).toFixed(0)}MB`
      : "RAM: unavailable";
    
  const memPercentage = 
    memUsedBytes && memTotalBytes
      ? `RAM usage: ${(((memTotalBytes - memUsedBytes)/memTotalBytes)*100).toFixed(1)}%`
      : `RAM usage: unavailable`
  
   const cpuLine = cpuPercent !== null ? `CPU: ${cpuPercent.toFixed(1)}%` : "CPU: unavailable";

     const message = [
    "📊 **Dax status**",
    ...machineLines,
    memLine,
    memPercentage,
    cpuLine,
  ].join("\n");

  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message }),
  });
}

checkStatus();
