# AWWA Dashboard - Google Sheets API Backend

Backend that fetches data from a **private** Google Sheet and exposes it to the AWWA dashboard.

**Flow:** Dashboard → This API → Google Sheets API

---

## Quick Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Create Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. **APIs & Services** → **Enable APIs** → Enable **Google Sheets API**
4. **IAM & Admin** → **Service Accounts** → **Create Service Account**
5. Name it (e.g. `awwa-sheets-reader`) → Create
6. **Keys** → **Add Key** → **Create new key** → **JSON** → Download

### 3. Share your Google Sheet

- Open your sheet
- Click **Share**
- Add the service account email (e.g. `awwa-sheets-reader@your-project.iam.gserviceaccount.com`)
- Give **Viewer** access

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|----------|-------------|
| `GOOGLE_CREDENTIALS` | Full JSON string (single line) **or** path to the JSON file |
| `SPREADSHEET_ID` | From URL: `docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit` |
| `API_KEY` | (Optional) Secret key for `X-Api-Key` header |
| `ALLOWED_ORIGINS` | (Optional) CORS origins, e.g. `https://your-app.netlify.app` (use `*` if traffic is proxied via Netlify same-origin `/api`) |

### 5. Run the server

```bash
npm start
```

API: `http://localhost:3001/api/conversations` (returns CSV)

---

## API Endpoints

| Endpoint | Auth | Returns |
|----------|------|---------|
| `GET /health` | None | `{ status: "ok" }` |
| `GET /api/conversations` | API key (if set) | CSV (default) |
| `GET /api/conversations?format=json` | API key (if set) | JSON |
| `GET /api/data` | API key (if set) | CSV |

**With API key:**
```
X-Api-Key: your_secret_api_key
# or
?api_key=your_secret_api_key
```

---

## Dashboard Configuration

The dashboard is static HTML in the `frontend/` folder (`first.html`). It defaults to `http://localhost:3001` on your machine; on Netlify it uses same-origin `/api/*` (see `frontend/netlify.toml` proxy to Render).

Optional query overrides: `?api_url=https://your-render-service.onrender.com` and `?api_key=...` if you enabled `API_KEY` on the server.

---

## Deploy (Render / Vercel / Netlify)

### Render (traditional Node server)

Create a Web Service with **root directory** `backend`, build `npm install`, start `npm start`. Set env vars from `.env.example` (paste `GOOGLE_CREDENTIALS` JSON as one line). You can use the repo `render.yaml` as a blueprint.

### Vercel (serverless — this folder)

Uses [Express on Vercel](https://vercel.com/docs/frameworks/backend/express): `server.js` exports the app; no extra `vercel.json` is required.

1. In [Vercel](https://vercel.com), **New Project** → import the same Git repo.
2. Set **Root Directory** to **`backend`** (required).
3. **Environment variables** (same as `.env.example`):
   - **`GOOGLE_CREDENTIALS`**: paste the **full service account JSON as one line** (do not rely on a file path; Vercel has no `credentials.json` file unless you add it to the repo, which you should not).
   - **`SPREADSHEET_ID`**, **`SHEET_RANGE`** (optional), **`API_KEY`** (optional), **`ALLOWED_ORIGINS`**: set to your real dashboard origin(s), e.g. `https://your-app.vercel.app` or `https://your-site.netlify.app` (comma-separated for multiple). Use `*` only for quick tests.
4. Deploy. Your API base URL will be `https://<project>.vercel.app` with paths `/health`, `/api/conversations`, etc.

**Dashboard:** If the UI is hosted on another domain, set **`PRODUCTION_API_BASE`** in `frontend/first.html` to that API origin (no trailing slash), or open the dashboard with `?api_url=https://<project>.vercel.app`.

### Netlify (frontend only)

New site from Git, base directory `frontend`, publish directory `.` (default). In `frontend/netlify.toml`, point the `/api/*` proxy to your API host (Render or Vercel).

---

## Sheet Format

First row = headers. Expected columns:

- `chat_id`, `message_id`, `role`, `coversation` (or `conversation`), `created_at`, `location`
