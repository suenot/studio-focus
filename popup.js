const $ = (id) => document.getElementById(id);

// Accepts @handle, UC channel id, or a youtube.com URL; returns "@handle" or "UC..." or null.
function parseChannel(line) {
  const s = line.trim();
  if (!s) return null;
  let m = s.match(/youtube\.com\/(@[\w.\-]+)/i) || s.match(/^(@[\w.\-]+)$/);
  if (m) return m[1];
  m = s.match(/(UC[\w-]{22})/);
  return m ? m[1] : null;
}

function renderStatus(s) {
  const left = s.pausedUntil - Date.now();
  $("status").textContent = left > 0 ? `Paused, ${Math.ceil(left / 60000)} min left` : "";
  $("pause15").textContent = left > 0 ? "Resume now" : "Pause 15 min";
}

chrome.storage.local.get({ enabled: true, pausedUntil: 0, channels: [] }, (s) => {
  $("enabled").checked = s.enabled;
  $("channels").value = s.channels.join("\n");
  renderStatus(s);
});

$("enabled").addEventListener("change", (e) => chrome.storage.local.set({ enabled: e.target.checked }));

$("pause15").addEventListener("click", () => {
  chrome.storage.local.get({ pausedUntil: 0 }, (s) => {
    const next = s.pausedUntil > Date.now() ? 0 : Date.now() + 15 * 60 * 1000;
    chrome.storage.local.set({ pausedUntil: next }, () => renderStatus({ pausedUntil: next }));
  });
});

$("channels").addEventListener("change", (e) => {
  const list = [...new Set(e.target.value.split("\n").map(parseChannel).filter(Boolean))];
  e.target.value = list.join("\n");
  chrome.storage.local.set({ channels: list });
});
