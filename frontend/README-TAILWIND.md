# Tailwind CSS (AWWA dashboard)

## Default (no install)

`awwa-conversations.html` loads **Tailwind via the Play CDN** and an inline `tailwind.config` with **AWWA / PROJECT DEEP** colors (`bg-awwa-primary`, `text-awwa-text`, etc.).

## Optional: compiled CSS (production)

1. From this folder (`AstroReport/`):

   ```bash
   npm install
   npm run css:build
   ```

2. In `awwa-conversations.html`, **remove** the two `<script>` tags that load/configure `cdn.tailwindcss.com`, and add:

   ```html
   <link rel="stylesheet" href="dist/tailwind.css" />
   ```

3. During development:

   ```bash
   npm run css:watch
   ```

`tailwind.config.js` scans `awwa-conversations.html` so only used utilities are included in `dist/tailwind.css`.
