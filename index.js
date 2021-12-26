if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const bodyparser = require("body-parser");
const session = require("express-session");
const app = express();
var mysql = require("mysql");

const req = require("express/lib/request");
const res = require("express/lib/response");

var con = mysql.createConnection({
  port: 3000,
  host: "localhost",
  user: "root",
  password: "",
  database: "dbmsproject",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("connected");
});

const port = 5000;
app.set("views", __dirname + "/screens/views");
app.use(express.static(__dirname + "/assets"));
app.use(express.static(__dirname + "/screens/css"));
app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

const users = [];
app.get("/", (req, res) => {
  req.session.loggedin = false;
  res.render("main.ejs");
});

app.get("/login", (req, res) => {
  req.session.loggedin = false;
  res.render("login.ejs", { title: "Login", msg: "" });
});
app.get("/register", (req, res) => {
  req.session.loggedin = false;
  res.render("register.ejs");
});
app.get("/home", (req, res) => {
  if (req.session.loggedin == true) {
    res.render("home.ejs");
  } else {
    res.redirect("login");
  }
});
app.post("/home", (req, res) => {
  req.session.loggedin = false;
  res.redirect("/");
});
app.post("/login", async (req, res) => {
  try {
    let useremail = req.body.email;
    let pass = req.body.password;
    con.query(
      "select UEmail,UPassword from user_profile where UEmail=? and UPassword=?",
      [useremail, pass],
      function (error, results, fields, rows) {
        if (results != undefined) {
          if (results.length > 0) {
            req.session.loggedin = true;
            req.session.useremail = useremail;
            req.session.password = pass;
            res.redirect("home");
          } else {
            req.session.loggedin = false;
            res.redirect("loginfail");
          }
        } else {
          req.session.loggedin = false;
          res.redirect("loginfail");
        }
      }
    );
  } catch (error) {}
});
app.post("/register", async (req, res) => {
  req.session.loggedin = false;
  let username = req.body.uname;
  let password = req.body.password;
  let email = req.body.email;
  let bdate = req.body.bdate;
  let phno = req.body.phno;
  let address = req.body.Address;
  try {
    con.query(
      "insert into user_profile(UName,UEmail,UPassword,Phno,Bdate,Address)values(?,?,?,?,?,?)",
      [username, email, password, phno, bdate, address],
      function (error, results, fields, rows) {
        res.render("login.ejs", { title: "login", msg: "" });
      }
    );
  } catch {
    res.redirect("register");
  }
});
app.get("/loginfail", (req, res) => {
  req.session.loggedin = false;
  res.render("login.ejs", {
    title: "Login",
    msg: "Sorry!!Please Enter Correct Email or Password",
  });
});
app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});
