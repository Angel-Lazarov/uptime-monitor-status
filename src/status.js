// src/status.js
// Status Worker – KV логовете красиво с легенда и таблица, без графика, най-новите отгоре
// Сега с главни букви за статуса и съкратена навигация, 30 записа на страница

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pageParam = parseInt(url.searchParams.get("page")) || 1;
    const pageSize = 30; // ново: 30 записа на страница

    const list = await env.UPTIME_LOG.list({ limit: 1000, reverse: true });
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

    const formatDate = ts => new Date(ts).toLocaleString("bg-BG", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });

    const displayStatus = status => status.charAt(0).toUpperCase() + status.slice(1);

    // Обърнат ред за визуализация: най-новите отгоре
    const itemsReversed = [...items].reverse();

    // Странициране
    const totalPages = Math.ceil(total / pageSize);
    const page = Math.min(Math.max(pageParam, 1), totalPages);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageItems = itemsReversed.slice(startIndex, endIndex);

    // Съкратена навигация: показваме само текущата ±2 страници + първата и последната
    const navLinks = [];
    if (page > 1) navLinks.push(`<a href="?page=${page-1}">« Предишна</a>`);

    if (page > 3) navLinks.push(`<a href="?page=1">1</a> ...`);

    for (let p = Math.max(1, page-2); p <= Math.min(totalPages, page+2); p++) {
      if (p === page) navLinks.push(`<strong>${p}</strong>`);
      else navLinks.push(`<a href="?page=${p}">${p}</a>`);
    }

    if (page < totalPages - 2) navLinks.push(`... <a href="?page=${totalPages}">${totalPages}</a>`);

    if (page < totalPages) navLinks.push(`<a href="?page=${page+1}">Следваща »</a>`);

    const nav = `<div style="margin-bottom: 15px;">${navLinks.join(" | ")}</div>`;

    const html = `
      <!DOCTYPE html>
      <html lang="bg">
      <head>
        <meta charset="UTF-8">
        <title>Uptime Monitor</title>
        <style>
          body { font-family: sans-serif; background: #f0f0f0; display: flex; justify-content: center; padding: 20px; }
          .container { max-width: 700px; width: 100%; text-align: center; }
          h1 { color: #4b4837; margin-bottom: 15px; }
          .summary { margin-bottom: 20px; }
          .summary div { margin: 4px 0; }
          .summary .status { font-weight: bold; color: ${lastStatus === "up" ? "green" : "red"}; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
          th { background: #4b4837; color: #eeebd9; }
          td.up { color: green; font-weight: bold; }
          td.down { color: red; font-weight: bold; }
          .legend { margin-bottom: 15px; font-size: 0.9em; }
          .legend span { display: inline-block; margin-right: 10px; }
          .legend .up { color: green; font-weight: bold; }
          .legend .down { color: red; font-weight: bold; }
          tr:hover { background-color: #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Uptime Monitor</h1>

          <div class="summary">
            <div>Последен статус: <span class="status">${displayStatus(lastStatus)}</span></div>
            <div>Общо записи: ${total}</div>
            <div>Up / Down: ${upCount} / ${downCount}</div>
            <div>Uptime %: ${uptimePercent}%</div>
          </div>

          <div class="legend">
            <span class="up">🟩 Up: ${upCount}</span>
            <span class="down">🟥 Down: ${downCount}</span>
          </div>

          ${nav}

          <table>
            <tr><th>Timestamp</th><th>Status</th></tr>
            ${pageItems.map(i => `<tr><td>${formatDate(i.timestamp)}</td><td class="${i.status}">${displayStatus(i.status)}</td></tr>`).join('')}
          </table>

          ${nav}
        </div>
      </body>
      </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
};
