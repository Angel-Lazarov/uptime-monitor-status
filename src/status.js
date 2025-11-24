// src/status.js
// Показва уеб страница с история на uptime

export default {
  async fetch(request, env) {
    const list = await env.UPTIME_LOG.list({ limit: 50, reverse: true });

    const items = await Promise.all(
      list.keys.map(async (k) => {
        const v = await env.UPTIME_LOG.get(k.name);
        if (!v) return null;
        try {
          return JSON.parse(v);
        } catch {
          return null;
        }
      })
    );

    const validItems = items.filter(Boolean);

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Uptime Monitor</title>
        <style>
          body { font-family: sans-serif; padding: 20px; background: #f0f0f0; }
          h1 { color: #4b4837; }
          table { border-collapse: collapse; width: 100%; max-width: 600px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #4b4837; color: #eeebd9; }
          td.up { color: green; font-weight: bold; }
          td.down { color: red; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Uptime Monitor</h1>
        <table>
          <tr><th>Timestamp</th><th>Status</th></tr>
          ${validItems.map(i => `<tr><td>${i.timestamp}</td><td class="${i.status}">${i.status}</td></tr>`).join('')}
        </table>
      </body>
      </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
};