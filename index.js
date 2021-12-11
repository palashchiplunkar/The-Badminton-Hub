const express = require("express");
const app = express();
const port = 5000;
app.set("views", __dirname + "/screens/views");
app.use(express.static(__dirname + "/assets"));
app.use(express.static(__dirname + "/screens/css"));
app.set("view-engine", "ejs");
app.get("/", (req, res) => {
  res.render("main.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
