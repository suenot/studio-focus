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

const today = () => new Date().toLocaleDateString("sv");

function renderUsed(s) {
  const used = s.unlockLog && s.unlockLog.day === today() ? s.unlockLog.count : 0;
  $("used").textContent = `(used today: ${used})`;
}

function renderStatus(s) {
  const left = s.pausedUntil - Date.now();
  $("status").textContent = left > 0 ? `Paused, ${Math.ceil(left / 60000)} min left` : "";
  $("pause15").textContent = left > 0 ? "Resume now" : "Pause 15 min";
}

chrome.storage.local.get({ enabled: true, pausedUntil: 0, channels: [], unlockLimit: 3, unlockLog: { day: "", count: 0 } }, (s) => {
  $("enabled").checked = s.enabled;
  $("limit").value = s.unlockLimit;
  renderUsed(s);
  $("channels").value = s.channels.join("\n");
  renderStatus(s);
});

$("enabled").addEventListener("change", (e) => chrome.storage.local.set({ enabled: e.target.checked }));

$("limit").addEventListener("change", (e) => {
  const n = Math.min(20, Math.max(0, Math.floor(Number(e.target.value)) || 0));
  e.target.value = n;
  chrome.storage.local.set({ unlockLimit: n });
});

// A 15-minute pause spends one daily unlock, like the button on the white page.
$("pause15").addEventListener("click", () => {
  chrome.storage.local.get({ pausedUntil: 0, unlockLimit: 3, unlockLog: { day: "", count: 0 } }, (s) => {
    if (s.pausedUntil > Date.now()) {
      chrome.storage.local.set({ pausedUntil: 0 }, () => renderStatus({ pausedUntil: 0 }));
      return;
    }
    const used = s.unlockLog.day === today() ? s.unlockLog.count : 0;
    if (used >= s.unlockLimit) { $("status").textContent = "No unlocks left today"; return; }
    const next = Date.now() + 15 * 60 * 1000;
    const log = { day: today(), count: used + 1 };
    chrome.storage.local.set({ pausedUntil: next, unlockLog: log }, () => {
      renderStatus({ pausedUntil: next });
      renderUsed({ unlockLog: log });
    });
  });
});

$("channels").addEventListener("change", (e) => {
  const list = [...new Set(e.target.value.split("\n").map(parseChannel).filter(Boolean))];
  e.target.value = list.join("\n");
  chrome.storage.local.set({ channels: list });
});
