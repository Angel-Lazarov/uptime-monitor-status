// src/status.js
// Status Worker – визуализира KV логовете красиво с графика и легенда

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

    const formatDate = (ts) => new Date(ts).toLocaleString("bg-BG", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });

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
          .summary .status { font-weight: bold; color: ${lastStatus === "up" ? "green" : "red"}; }
          table { border-collapse: collapse; width: 100%; max-width: 600px; margin-bottom: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #4b4837; color: #eeebd9; }
          td.up { color: green; font-weight: bold; }
          td.down { color: red; font-weight: bold; }

          /* Малък график */
          .graph { display: flex; gap: 2px; height: 20px; margin-bottom: 5px; }
          .bar { flex: 1; height: 100%; }
          .bar.up { background-color: green; }
          .bar.down { background-color: red; }

          /* Легенда за графиката */
          .legend { margin-bottom: 20px; font-size: 0.9em; }
          .legend span { display: inline-block; margin-right: 10px; }
          .legend .up { color: green; font-weight: bold; }
          .legend .down { color: red; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Uptime Monitor</h1>
        <div class="summary">
          <div>Последен статус: <span class="status">${lastStatus}</span></div>
          <div>Общо записи: ${total}</div>
          <div>Up / Down: ${upCount} / ${downCount}</div>
          <div>Uptime %: ${uptimePercent}%</div>
        </div>

        <div class="legend">
          <span class="up">🟩 Up: ${upCount}</span>
          <span class="down">🟥 Down: ${downCount}</span>
        </div>
        <div class="graph">
          ${items.map(i => `<div class="bar ${i.status}"></div>`).join('')}
        </div>

        <table>
          <tr><th>Timestamp</th><th>Status</th></tr>
          ${items.map(i => `<tr><td>${formatDate(i.timestamp)}</td><td class="${i.status}">${i.status}</td></tr>`).join('')}
        </table>
      </body>
      </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
};
