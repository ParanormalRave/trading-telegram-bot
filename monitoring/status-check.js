const FLY_API_TOKEN = process.env.FLY_API_TOKEN;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const APP_NAME = `daxthebot-soft-shape-4207`;

async function checkStatus() {
  const res = await fetch(
    `https://api.machines.dev/v1/apps/${APP_NAME}/machines`,
    {
      headers: { Authorization: `Bearer ${FLY_API_TOKEN}` },
    },
  );

  const machines = await res.json();
  console.log("Raw response:", JSON.stringify(machines, null, 2)); 
  console.log("Response status:", res.status); 
  const lines = machines.map((m) => {
    const uptimeMs = Date.now() - new Date(m.updated_at).getTime();
    const uptimeMin = Math.floor(uptimeMs / 60000);
    return `**${m.region}** — ${m.state} — up ${uptimeMin}m`;
  });

  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `📊 Dax status:\n${lines.join("\n")}` }),
  });
}

checkStatus();
