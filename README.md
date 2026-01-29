# Node200 EJS Portfolio

## Google Sheets setup
- Required env vars: `GOOGLE_SERVICE_ACCOUNT_JSON` (service account JSON string), `PORT` (optional).
- Spreadsheet ID: `1n6C-3ddkxs-r_gaG8TYOICOdqm2DMKliObqmsshjI_Q`.
- Share the spreadsheet with the service account email (shown in the service account JSON `client_email`).

### Local testing
1. Set `GOOGLE_SERVICE_ACCOUNT_JSON` in your shell (or use a local `.env` file you do not commit).
2. Install deps and run the server: `npm install` then `npm start` (or `node server.js`).
3. Visit `http://localhost:3000/contact` and submit the form.

## Render deployment
- Service type: Web Service
- Build command: `npm install`
- Start command: `npm start`
- Env vars in Render dashboard:
  - `GOOGLE_SERVICE_ACCOUNT_JSON` (paste the JSON string)
- Node version: set via `package.json` `engines` (currently `>=18`).
