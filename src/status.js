// src/status.js
// Status Worker – визуализира KV логовете красиво с легенда и таблица, без графика, най-новите отгоре
// Сега с главни букви за статуса за по-добра четимост

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

    const formatDate = ts => new Date(ts).toLocaleString("bg-BG", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });

    // Функция за показване на статуса с главна буква
    const displayStatus = status => status.charAt(0).toUpperCase() + status.slice(1);

    // Обърнат ред за визуализация: най-новите отгоре
    const itemsReversed = [...items].reverse();

    const html = `
      <!DOCTYPE html>
      <html lang="bg">
      <head>
        <meta charset="UTF-8">
        <title>Uptime Monitor</title>
        <style>
          /* Основни стилове */
          body { font-family: sans-serif; background: #f0f0f0; display: flex; justify-content: center; padding: 20px; }
          .container { max-width: 700px; width: 100%; text-align: center; }
          h1 { color: #4b4837; margin-bottom: 15px; }

          /* Summary блок */
          .summary { margin-bottom: 20px; }
          .summary div { margin: 4px 0; }
          .summary .status { font-weight: bold; color: ${lastStatus === "up" ? "green" : "red"}; }

          /* Таблица */
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
          th { background: #4b4837; color: #eeebd9; }
          td.up { color: green; font-weight: bold; }
          td.down { color: red; font-weight: bold; }

          /* Легенда */
          .legend { margin-bottom: 15px; font-size: 0.9em; }
          .legend span { display: inline-block; margin-right: 10px; }
          .legend .up { color: green; font-weight: bold; }
          .legend .down { color: red; font-weight: bold; }

          /* Предложение: може да добавиш hover ефект на редовете на таблицата за по-добра четимост */
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

          <table>
            <tr><th>Timestamp</th><th>Status</th></tr>
            ${itemsReversed.map(i => `<tr><td>${formatDate(i.timestamp)}</td><td class="${i.status}">${displayStatus(i.status)}</td></tr>`).join('')}
          </table>
        </div>
      </body>
      </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
};