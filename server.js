const { google } = require("googleapis");
const { GoogleAuth } = require("google-auth-library");
const fs = require("fs");
const path = require("path");

const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

const staticRootFromDir = path.join(__dirname, "public");
const staticRootFromCwd = path.join(process.cwd(), "public");
const staticRoot = fs.existsSync(staticRootFromDir)
  ? staticRootFromDir
  : staticRootFromCwd;

console.log(
  `[static] __dirname=${__dirname} cwd=${process.cwd()} ` +
    `dirRoot=${staticRootFromDir} cwdRoot=${staticRootFromCwd} using=${staticRoot}`
);

app.use((req, res, next) => {
  console.log(`[req] ${req.method} ${req.path}`);
  next();
});

app.use(express.static(staticRoot));

app.use((req, res, next) => {
  if (req.path === "/styles.css") {
    const resolvedStyles = path.join(staticRoot, "styles.css");
    console.log(
      `[styles] fallthrough resolved=${resolvedStyles} exists=${fs.existsSync(resolvedStyles)}`
    );
  }
  next();
});

app.set("view engine", "ejs");

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/contact", (req, res) => {
  res.render("contact", { errors: [], values: {} });
});

app.post("/thanks", async (req, res) => {
  const values = {
    firstName: req.body.firstName || "",
    lastName: req.body.lastName || "",
    email: req.body.email || "",
  };

  const honeypotValue = req.body.companyWebsite || "";
  if (honeypotValue.trim()) {
    return res.render("thanks", { contact: values });
  }

  const errors = [];
  if (!values.firstName.trim()) {
    errors.push("First name is required.");
  }
  if (!values.lastName.trim()) {
    errors.push("Last name is required.");
  }
  if (!values.email.trim()) {
    errors.push("Email is required.");
  }

  if (errors.length > 0) {
    return res.status(400).render("contact", { errors, values });
  }

  try {
    const SPREADSHEET_ID = "1n6C-3ddkxs-r_gaG8TYOICOdqm2DMKliObqmsshjI_Q";

    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      return res
        .status(500)
        .render("contact", {
          errors: ["Server is missing Google Sheets credentials."],
          values,
        });
    }

    const creds = JSON.parse(serviceAccountJson);
    if (creds && creds.client_email) {
      console.log(`Using Sheets service account: ${creds.client_email}`);
    }

    const auth = new GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const sheetValues = [[
      values.firstName,
      values.lastName,
      values.email,
      new Date().toISOString(),
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:D",
      valueInputOption: "USER_ENTERED",
      resource: { values: sheetValues },
    });

    res.render("thanks", { contact: values });
  } catch (err) {
    console.error("Sheets error:", err);
    res.status(500).render("contact", {
      errors: ["Sorry, we could not save your message. Please try again."],
      values,
    });
  }
});



app.get("/sheets-auth", (req, res) => {
  console.log("Sheets auth request received");
  res.status(200).send("Sheets auth connected");
});

app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.path}`);
  res.status(404).send("404 Not Found");
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
