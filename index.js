if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
var todayDate = new Date().toISOString().slice(0, 10);
console.log(todayDate);
const express = require("express");
const bodyparser = require("body-parser");
const session = require("express-session");
const app = express();
var mysql = require("mysql");

const req = require("express/lib/request");
const res = require("express/lib/response");

var con = mysql.createConnection({
  port: 4001,
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
      "select * from user_profile where UEmail=? and UPassword=?",
      [useremail, pass],
      function (error, results, fields, rows) {
        if (results != undefined) {
          if (results.length > 0) {
            req.session.loggedin = true;
            req.session.useremail = useremail;
            req.session.password = pass;
            if (useremail == "admin@badmintonHub.com") {
              req.session.adminlogin = true;
              res.redirect("adminHome");
            } else {
              req.session.userid = results[0].userid;
              console.log(req.session.userid);
              res.redirect("Home");
              console.log(results);
            }
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

app.get("/AdminHome", (req, res) => {
  if (req.session.adminlogin == true) {
    res.render("AdminHome.ejs");
  } else {
    res.redirect("login");
  }
});
app.get("/addProducts", (req, res) => {
  if (req.session.adminlogin == true) {
    res.render("addProducts.ejs", {
      msg: "",
    });
  } else {
    res.redirect("login");
  }
});
app.post("/addProducts", (req, res) => {
  try {
    let pname = req.body.pname;
    let description = req.body.description;
    let category = req.body.select_product;
    let cost = req.body.cost;
    con.query(
      "insert into products(type,cost,description,product_name)values(?,?,?,?)",
      [category, cost, description, pname],
      function (error, results, fields, rows) {
        res.render("addProducts.ejs", {
          msg: "Product added Successfully",
        });
      }
    );
  } catch (error) {
    res.redirect("addProducts", {
      msg: "",
    });
  }
});
app.get("/products", (req, res) => {
  let result = [];
  res.render("products.ejs", {
    result: result,
  });
});
app.post("/search_products", (req, res) => {
  let type = req.body.select_product;

  try {
    con.query(
      "SELECT * FROM products where Type=?",
      [type],

      function (err, result, fields) {
        res.render("products.ejs", {
          result: result,
        });
      }
    );
  } catch (error) {}
});

app.get("/cart", (req, res) => {
  con.query(
    "select ci.product_name,ci.quantity,ci.date_added,ci.price from cart_item ci, cart c where c.userid=? and c.cart_id=ci.cart_id",
    [req.session.userid],
    function (error, results, fields, rows) {
      res.render("cartPage.ejs");
    }
  );
});
app.post("/cart/:id", (req, res) => {
  con.query(
    "select * from cart where userid=?",
    [req.session.userid],
    function (error, results, fields, rows) {
      if (results.length == 0) {
        con.query(
          "insert into cart(userid)values(?)",
          [req.session.userid],
          function (error, results, fields, rows) {
            con.query(
              "select * from cart where userid=?",
              [req.session.userid],
              function (error, results, fields, rows) {
                let cartid = results[0].cart_id;
                con.query(
                  "select product_name,cost from products where product_id=?",
                  [req.params.id],
                  function (error, results, fields, rows) {
                    con.query(
                      "insert into cart_item(product_id,cart_id,product_name,quantity,date_added,price) values(?,?,?,?,?,?)",
                      [
                        req.params.id,
                        cartid,
                        results[0].product_name,
                        1,
                        todayDate,
                        results[0].cost,
                      ]
                    );
                  }
                );
              }
            );
          }
        );
      } else {
        let cartid = results[0].cart_id;
        con.query(
          "select product_name,cost from products where product_id=?",
          [req.params.id],
          function (error, results, fields, rows) {
            con.query(
              "insert into cart_item(product_id,cart_id,product_name,quantity,date_added,price) values(?,?,?,?,?,?)",
              [
                req.params.id,
                cartid,
                results[0].product_name,
                1,
                todayDate,
                results[0].cost,
              ]
            );
          }
        );
      }
    }
  );
});
app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});
