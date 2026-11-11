# Studio Focus

Open-source browser extension for YouTube creators. You go to YouTube to check your channel or analytics, then lose an hour to the feed. Studio Focus covers every youtube.com page with a plain white screen, except the ones you need to run your channels.

Site: https://studio-focus.suenot.com

## What stays visible

- YouTube Studio (`studio.youtube.com`), always.
- Channel switcher and account pages (`/channel_switcher`, `/account`).
- Your own channels, which you list in the popup (`@handle`, channel ID or URL).

Everything else (home feed, watch pages, Shorts, search, other channels) is covered. Videos are paused while covered.

The white screen has shortcuts to Studio, the channel switcher and your channels, plus "Unlock for 5 minutes" when you really need a page.

## Install (from source)

1. Clone this repo.
2. Open `chrome://extensions`, enable Developer mode.
3. "Load unpacked" and pick this folder.

Works in Chrome, Edge, Brave and other Chromium browsers (Manifest V3).

## Privacy

No network requests, no analytics. Settings are stored locally with `chrome.storage.local`.

## License

MIT
