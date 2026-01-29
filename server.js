const fs = require("fs");
const readline = require("readline");
const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");

const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.post("/thanks", async (req, res) => {
  try {
    const SPREADSHEET_ID = "1n6C-3ddkxs-r_gaG8TYOICOdqm2DMKliObqmsshjI_Q";

    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      return res.status(500).send("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
    }

    const { GoogleAuth } = require("google-auth-library");
    const creds = JSON.parse(serviceAccountJson);

console.log("Using service account:", creds.client_email);

const auth = new GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});


    const sheets = google.sheets({ version: "v4", auth });

    const values = [[
      req.body.firstName,
      req.body.lastName,
      req.body.email,
      new Date().toISOString(),
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:D",
      valueInputOption: "USER_ENTERED",
      resource: { values },
    });

    res.render("thanks", { contact: req.body });
  } catch (err) {
    console.error("Sheets error:", err);
    res.status(500).send("Failed to save contact");
  }
});



app.get("/sheets-auth", (req, res) => {
  console.log("Sheets auth request received");
  res.status(200).send("Sheets auth connected");
});

app.use((req, res) => {
  res.status(404).send("404 Not Found");
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
