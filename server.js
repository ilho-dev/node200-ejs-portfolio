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
  res.render("thanks", { contact: req.body });
});

app.use((req, res) => {
  res.status(404).send("404 Not Found");
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
