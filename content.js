// Studio Focus: cover youtube.com with a white page unless the URL is
// channel switching, account management, or one of the user's own channels.
// studio.youtube.com is excluded in the manifest and is never covered.
(() => {
  const ROOT_ID = "studio-focus-root";
  const ALLOWED_PREFIXES = ["/channel_switcher", "/account", "/signin", "/logout", "/premium_benefits"];
  const DEFAULTS = { enabled: true, pausedUntil: 0, channels: [] };

  let state = { ...DEFAULTS };
  let lastHref = "";

  const isAllowed = (path) => {
    const p = path.toLowerCase();
    if (ALLOWED_PREFIXES.some((x) => p === x || p.startsWith(x + "/") || p.startsWith(x + "_") || p.startsWith(x + "?"))) return true;
    return state.channels.some((c) => {
      const base = (c.startsWith("UC") ? "/channel/" + c : "/" + c).toLowerCase();
      return p === base || p.startsWith(base + "/");
    });
  };

  const shouldCover = () =>
    state.enabled && Date.now() >= state.pausedUntil && !isAllowed(location.pathname);

  const studioLinks = () => {
    const links = [
      ["Open YouTube Studio", "https://studio.youtube.com/"],
      ["Switch channel", "https://www.youtube.com/channel_switcher"],
    ];
    for (const c of state.channels) {
      if (c.startsWith("UC")) links.push([c, "https://studio.youtube.com/channel/" + c]);
      else links.push([c, "https://www.youtube.com/" + c]);
    }
    return links;
  };

  const CSS = `
    :host { all: initial; }
    .wrap { position: fixed; inset: 0; z-index: 2147483647; background: #fff; color: #111;
      font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex; align-items: center; justify-content: center; }
    .card { text-align: center; max-width: 420px; padding: 24px; }
    h1 { font-size: 22px; font-weight: 600; margin: 0 0 6px; }
    p { margin: 0 0 24px; color: #666; }
    a.btn { display: block; margin: 8px 0; padding: 12px 16px; border-radius: 10px;
      border: 1px solid #e3e3e3; color: #111; text-decoration: none; font-weight: 500; }
    a.btn:first-of-type { background: #111; color: #fff; border-color: #111; }
    a.btn:hover { opacity: .85; }
    button { margin-top: 20px; background: none; border: 0; color: #888; font: inherit;
      font-size: 14px; cursor: pointer; text-decoration: underline; }
  `;

  const buildOverlay = () => {
    const host = document.createElement("div");
    host.id = ROOT_ID;
    const root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = CSS;
    const wrap = document.createElement("div");
    wrap.className = "wrap";
    const card = document.createElement("div");
    card.className = "card";
    const h1 = document.createElement("h1");
    h1.textContent = "Focus mode";
    const p = document.createElement("p");
    p.textContent = "YouTube content is hidden. Manage your channel, not the feed.";
    card.append(h1, p);
    for (const [label, href] of studioLinks()) {
      const a = document.createElement("a");
      a.className = "btn";
      a.href = href;
      a.textContent = label;
      card.append(a);
    }
    const btn = document.createElement("button");
    btn.textContent = "Unlock for 5 minutes";
    btn.addEventListener("click", () => {
      chrome.storage.local.set({ pausedUntil: Date.now() + 5 * 60 * 1000 });
    });
    card.append(btn);
    wrap.append(card);
    root.append(style, wrap);
    return host;
  };

  const lockScroll = (on) => {
    document.documentElement.style.overflow = on ? "hidden" : "";
  };

  const pauseMedia = () => {
    document.querySelectorAll("video, audio").forEach((m) => { try { m.pause(); } catch (_) {} });
  };

  const render = () => {
    lastHref = location.href;
    const existing = document.getElementById(ROOT_ID);
    if (shouldCover()) {
      if (existing) existing.remove();
      document.documentElement.append(buildOverlay());
      lockScroll(true);
      pauseMedia();
    } else {
      if (existing) existing.remove();
      lockScroll(false);
    }
  };

  // Block autoplay and background playback while covered.
  document.addEventListener("play", (e) => {
    if (shouldCover()) { try { e.target.pause(); } catch (_) {} }
  }, true);

  const load = (cb) => chrome.storage.local.get(DEFAULTS, (v) => { state = { ...DEFAULTS, ...v }; cb && cb(); });

  chrome.storage.onChanged.addListener(() => load(render));

  load(render);

  // YouTube is a SPA: watch for URL changes, keep the overlay mounted, expire pauses.
  setInterval(() => {
    const present = !!document.getElementById(ROOT_ID);
    if (location.href !== lastHref || present !== shouldCover()) render();
    else if (present) pauseMedia();
  }, 300);
})();
