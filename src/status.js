// src/status.js
// Status Worker – визуализира KV логовете красиво

export default {
  async fetch(request, env) {
    const list = await env.UPTIME_LOG.list({ limit: 50, reverse: true });
    const items = await Promise.all(
      list.keys.map(async (k) => {
        const v = await env.UPTIME_LOG.get(k.name);
        return JSON.parse(v);
      })
    );

    const total = items.length;
    const upCount = items.filter(i => i.status === "up").length;
    const downCount = total - upCount;
    const lastStatus = total ? items[0].status : "unknown";
    const uptimePercent = total ? ((upCount / total) * 100).toFixed(1) : "0.0";

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Uptime Monitor</title>
        <style>
          body { font-family: sans-serif; padding: 20px; background: #f0f0f0; }
          h1 { color: #4b4837; }
          .summary { margin-bottom: 20px; }
          .summary div { margin: 4px 0; }
          table { border-collapse: collapse; width: 100%; max-width: 600px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #4b4837; color: #eeebd9; }
          td.up { color: green; font-weight: bold; }
          td.down { color: red; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Uptime Monitor</h1>
        <div class="summary">
          <div>Последен статус: ${lastStatus}</div>
          <div>Общо записи: ${total}</div>
          <div>Up / Down: ${upCount} / ${downCount}</div>
          <div>Uptime %: ${uptimePercent}%</div>
        </div>
        <table>
          <tr><th>Timestamp</th><th>Status</th></tr>
          ${items.map(i => `<tr><td>${i.timestamp}</td><td class="${i.status}">${i.status}</td></tr>`).join('')}
        </table>
      </body>
      </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
};
