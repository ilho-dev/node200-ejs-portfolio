const fs = require("fs");
const readline = require("readline");
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

app.post("/thanks", (req, res) => {
  const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
  const TOKEN_PATH = "token.json";
  const SPREADSHEET_ID = "1n6C-3ddkxs-r_gaG8TYOIC0dqm2DMKliObqmsshjI_Q";

  fs.readFile("credentials.json", (err, content) => {
    if (err) {
      console.error("Error loading credentials:", err);
      return res.status(500).send("Server auth error");
    }
    authorize(JSON.parse(content), appendToSheet);
  });

  function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getNewToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
  }

  function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });

    console.log("Authorize this app by visiting:", authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error("Token error", err);
        oAuth2Client.setCredentials(token);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), () => {});
        callback(oAuth2Client);
      });
    });
  }

  function appendToSheet(auth) {
    const sheets = google.sheets({ version: "v4", auth });

    const values = [[
      req.body.firstName,
      req.body.lastName,
      req.body.email,
      new Date().toISOString(),
    ]];

    sheets.spreadsheets.values.append(
      {
        spreadsheetId: SPREADSHEET_ID,
        range: "Sheet1!A:D",
        valueInputOption: "USER_ENTERED",
        resource: { values },
      },
      (err) => {
        if (err) {
          console.error("Sheets error:", err);
          return res.status(500).send("Failed to save contact");
        }
        res.render("thanks", { contact: req.body });
      }
    );
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
