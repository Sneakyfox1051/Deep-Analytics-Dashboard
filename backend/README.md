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

The dashboard lives in `frontend/` (`first.html`). Locally it talks to `http://localhost:3001`.

**Production (recommended):** Host the frontend on **Netlify** (or any static host) and proxy `/api/*` to Render using `frontend/netlify.toml` — then the browser calls same-origin `/api/...` and you avoid CORS setup.

**Alternative:** Host the frontend anywhere and set **`PRODUCTION_API_BASE`** in `frontend/first.html` to your Render URL (e.g. `https://your-service.onrender.com`, no trailing slash). Then set **`ALLOWED_ORIGINS`** on Render to your real dashboard URL(s).

Optional: `?api_url=...` and `?api_key=...` on the URL for testing.

---

## Deploy backend on Render

1. In the [Render Dashboard](https://dashboard.render.com), **New +** → **Web Service** and connect this GitHub repo (or use **Blueprints** with the repo `render.yaml` at the root).
2. Configure the service:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Under **Environment**, add the same variables as `.env.example` (use **Sync .env** or add manually):

| Variable | Render notes |
|----------|----------------|
| `GOOGLE_CREDENTIALS` | Paste the **entire** service account JSON as **one line** (no `credentials.json` file on disk). |
| `SPREADSHEET_ID` | Required. |
| `SHEET_RANGE` | Optional; default `Sheet1!A:Z`. |
| `API_KEY` | Optional; must match what the dashboard sends as `X-Api-Key`. |
| `ALLOWED_ORIGINS` | Your dashboard origin(s), comma-separated, e.g. `https://your-site.netlify.app`. Use `*` only for quick tests. |

4. Deploy and wait for the service URL (e.g. `https://awwa-sheets-api.onrender.com`).
5. Confirm **`GET /health`** returns JSON `{"status":"ok",...}`.

**Cold starts:** Free tier services spin down; the first request after idle can take ~30–60s.

---

## Deploy frontend (Netlify example)

1. **New site** from Git → set **Base directory** to **`frontend`**, publish directory **`.`** (default).
2. In **`frontend/netlify.toml`**, replace **`YOUR-SERVICE`** with your Render hostname (e.g. `awwa-sheets-api.onrender.com` — no `https://`).
3. Redeploy the Netlify site.

---

## Sheet Format

First row = headers. Expected columns:

- `chat_id`, `message_id`, `role`, `coversation` (or `conversation`), `created_at`, `location`
