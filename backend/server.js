/**
 * AWWA Dashboard - Google Sheets API Backend
 * 
 * Flow: Dashboard → This API → Google Sheets API
 * 
 * Features:
 * - Service account authentication (no OAuth popup)
 * - Optional API key protection
 * - CORS for dashboard origin
 * - Returns CSV or JSON for dashboard compatibility
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3001;

// Behind Render / other reverse proxies
app.set('trust proxy', 1);

// --- CORS ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
app.use(cors({
  origin: allowedOrigins[0] === '*' ? true : allowedOrigins,
  credentials: true
}));

app.use(express.json());

// --- Auth check ---
function requireApiKey(req, res, next) {
  if (!process.env.API_KEY) return next(); // No API key configured = open
  
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (key !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
  }
  next();
}

// --- Google Sheets client ---
async function getSheetsClient() {
  const credentials = process.env.GOOGLE_CREDENTIALS;
  if (!credentials) {
    throw new Error('GOOGLE_CREDENTIALS not set. Add service account JSON or path to .env');
  }

  let key;
  if (credentials.trim().startsWith('{')) {
    key = JSON.parse(credentials);
  } else {
    const fs = require('fs');
    const path = require('path');
    const keyPath = path.resolve(process.cwd(), credentials.trim());
    key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  }

  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  return google.sheets({ version: 'v4', auth });
}

// --- Fetch sheet data ---
async function fetchSheetData() {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const range = process.env.SHEET_RANGE || 'Sheet1!A:Z';

  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID not set in .env');
  }

  const sheets = await getSheetsClient();
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  });

  const rows = data.values || [];
  if (rows.length === 0) return [];

  return rows;
}

// --- Convert to CSV ---
function toCSV(rows) {
  return rows.map(row =>
    row.map(cell => {
      const s = String(cell ?? '');
      const needsQuotes = /[,"\n\r]/.test(s);
      return needsQuotes ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')
  ).join('\n');
}

// --- Convert to JSON (array of objects) ---
function toJSON(rows) {
  const headers = rows[0].map(h => String(h || '').trim());
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] != null ? String(row[i]).trim() : '');
    return obj;
  });
}

// --- API Routes ---

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'awwa-sheets-api' });
});

app.get('/api/conversations', requireApiKey, async (req, res) => {
  const format = req.query.format || 'csv';

  try {
    const rows = await fetchSheetData();

    if (format === 'json') {
      return res.json(toJSON(rows));
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(toCSV(rows));
  } catch (err) {
    console.error('Sheets API error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch sheet data',
      message: err.message
    });
  }
});

// Fallback for dashboard fetch (same as /api/conversations, returns CSV)
app.get('/api/data', requireApiKey, async (req, res) => {
  try {
    const rows = await fetchSheetData();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(toCSV(rows));
  } catch (err) {
    console.error('Sheets API error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch sheet data',
      message: err.message
    });
  }
});

// --- 404 ---
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// --- Start ---
app.listen(PORT, () => {
  console.log(`AWWA Sheets API running on http://localhost:${PORT}`);
  if (!process.env.SPREADSHEET_ID) console.warn('  ⚠ SPREADSHEET_ID not set');
  if (!process.env.GOOGLE_CREDENTIALS) console.warn('  ⚠ GOOGLE_CREDENTIALS not set');
  if (process.env.API_KEY) console.log('  ✓ API key auth enabled');
});
