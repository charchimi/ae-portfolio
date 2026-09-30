# Handoff frontend-dev T12

- Contrast: inactive `.obj-step` / `.how-step` no longer use opacity. Inactive text = --faint (#7b8b94, 5.7:1 on the page bg); active = ink/muted plus a 2px signal left rule. Measured in browser: all >= 5.7:1.
- LCP: boot overlay fade delay 1.05s -> .5s (fade .25s, trace .42s, labels .05-.25s); ready timer 1250 -> 600 ms (inline script in index.html); hero text/lead/cta/stats transitions start at .05-.24s (were .35-.7s) and run .6-.7s.
- Images: the three kit images in index.html already had width/height; the lazy images without dimensions were the menu-preview thumbnails created in ui.js. They now carry width=800 height=450.
- Checked 1440 + 375: no console errors/warnings; no horizontal overflow at rest (a transient overflow appears only while the deck-shuffle ghost flies out, body clips it). Not measured: real Lighthouse LCP (my in-page observer did not report).
- Committed locally, not pushed. .gitignore and workflow untouched.
