if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
var todayDate = new Date().toISOString().slice(0, 10);
const express = require("express");
const bodyparser = require("body-parser");
const session = require("express-session");
const app = express();
var mysql = require("mysql");
const fileUpload = require("express-fileupload");
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
app.use(express.static(__dirname + "/uploads"));
app.use(express.static(__dirname + "/screens/css"));
app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(fileUpload());
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
  res.render("register.ejs", {
    msg: "",
  });
});
app.get("/home", (req, res) => {
  if (req.session.loggedin == true) {
    res.render("home.ejs");
  } else {
    res.redirect("login");
  }
});
app.post("/logout", (req, res) => {
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
              req.session.userid = results[0].userid;
              req.session.adminlogin = true;
              res.redirect("adminHome");
            } else {
              req.session.userid = results[0].userid;
              console.log(req.session.userid);
              res.redirect("Home");
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
// app.post("/login", loginCheck);
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
      `select * from user_profile where UEmail="${email}"`,
      function (error, results, fields, rows) {
        if (error) throw error;
        if (results.length == 0) {
          con.query(
            "insert into user_profile(UName,UEmail,UPassword,Phno,Bdate,Address)values(?,?,?,?,?,?)",
            [username, email, password, phno, bdate, address],
            function (error, results, fields, rows) {
              res.render("login.ejs", { title: "login", msg: "" });
            }
          );
        } else {
          res.render("register.ejs", {
            msg: "user already registered",
          });
        }
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
  let samplefile;
  let uploadPath;
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded");
  }
  samplefile = req.files.img;
  uploadPath = __dirname + "/uploads/" + samplefile.name;
  samplefile.mv(uploadPath, function (err) {
    if (err) res.status(500).send(err);
  });
  try {
    let pname = req.body.pname;
    let description = req.body.description;
    let category = req.body.select_product;
    let cost = req.body.cost;

    con.query(
      "insert into products(type,cost,description,product_name,product_image)values(?,?,?,?,?)",
      [category, cost, description, pname, samplefile.name],
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
  let sql = "select * from products";
  con.query(sql, function (error, results, fields, rows) {
    if (error) throw error;
    res.render("products.ejs", {
      result: results,
    });
  });
});
app.get("/search_products", (req, res) => {
  let type = req.query.select_product;

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
  let total;
  con.query(
    "select * from cart_item where cart_id in (select cart_id from cart where userid=?)",
    [req.session.userid],
    function (error, results, fields, rows) {
      console.log(results.length);
      if (results.length != 0) {
        con.query(
          `SELECT sum(price) as sum from cart_item ci,cart c where ci.cart_id=c.cart_id and c.userid=${req.session.userid} GROUP BY c.cart_id;`,
          function (error, results, fields, rows) {
            total = results[0].sum;
          }
        );
        let sql = `select ci.product_id,ci.product_name,ci.quantity,ci.date_added,ci.price from cart_item ci, cart c where c.userid=${req.session.userid} and c.cart_id=ci.cart_id`;

        try {
          con.query(sql, function (error, results, fields, rows) {
            res.render("cartPage.ejs", {
              result: results,
              total: total,
              msg: "",
            });
          });
        } catch (error) {
          console.log(error);
        }
      } else {
        res.render("cartPage.ejs", {
          result: [],
          total: 0,
          msg: "Your Cart is Empty",
        });
      }
    }
  );
});

app.post("/cart/delete/:id", (req, res) => {
  console.log(req.params.id, req.session.userid);
  let id = req.params.id;
  con.query(
    `delete from cart_item where product_id=${id} and cart_id = (select cart_id from cart where userid=${req.session.userid})`,

    function (error, results, fields, rows) {
      if (error) throw error;
      res.redirect("/cart");
      console.log(results);
    }
  );
});

app.post("/products/:id", (req, res) => {
  console.log(req.params.id);
  let result = [];
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
                      ],
                      function (error, results, fields, rows) {
                        res.send("<h1>Added To cart</h1>");
                      }
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
          "select product_name,cost,type from products where product_id=?",
          [req.params.id],
          function (error, results, fields, rows) {
            let type = results[0].type;
            con.query(
              "insert into cart_item(product_id,cart_id,product_name,quantity,date_added,price) values(?,?,?,?,?,?)",
              [
                req.params.id,
                cartid,
                results[0].product_name,
                1,
                todayDate,
                results[0].cost,
              ],
              function (error, results, fields, rows) {
                res.send("<h1>Added To cart</h1>");
              }
            );
          }
        );
      }
    }
  );
});

app.get("/profile", (req, res) => {
  console.log(req.session.userid);
  try {
    con.query(
      "select * from user_profile where userid=?",
      [req.session.userid],
      function (error, results, fields, rows) {
        res.render("profile.ejs", {
          result: results,
        });
      }
    );
  } catch (error) {}
});
app.get("/payment", (req, res) => {
  let total, count;
  con.query(
    `SELECT sum(price) as sum,count(*) as count from cart_item ci,cart c where ci.cart_id=c.cart_id and c.userid=${req.session.userid} GROUP BY c.cart_id`,
    function (error, results, fields, rows) {
      total = results[0].sum;
      count = results[0].count;
    }
  );
  con.query(
    `select ci.product_name,ci.quantity,ci.date_added,ci.price from cart_item ci, cart c where c.userid=${req.session.userid} and c.cart_id=ci.cart_id`,
    function (error, results, fields, rows) {
      res.render("payment.ejs", {
        result: results,
        total: total,
        count: count,
      });
    }
  );
});
app.get("/orders", (req, res) => {
  let cartid = 0;
  con.query(
    `select cart_id from cart where userid=${req.session.userid}`,
    function (error, results, fields, rows) {
      cartid = results[0].cart_id;
      console.log(cartid);
    }
  );
  con.query(
    `select * from payment py,cart_item ci,cart c where py.cart_id=ci.cart_id and c.cart_id=ci.cart_id and c.userid=${req.session.userid}`,
    function (error, results, fields, rows) {
      if (results != undefined) {
        con.query(
          `select o.order_id,p.product_name,p.cost as price,o.payment_id from products p,orders o where p.product_id=o.product_id and cart_id=${cartid} `,
          function (error, results, fields, rows) {
            if (error) throw error;
            res.render("orders.ejs", {
              result: results,
              date: todayDate,
            });
          }
        );
      } else {
        res.render("orders.ejs", {
          result: [],
          date: null,
        });
      }
    }
  );
});

app.post("/orders/delete/:id", (req, res) => {
  con.query(
    `delete from orders where order_id=${req.params.id}`,
    function (error, results, fields, rows) {
      res.redirect("/orders");
    }
  );
});

app.post("/payment", (req, res) => {
  con.query(
    `select cart_id from cart where userid=${req.session.userid}`,
    function (error, results, fields, rows) {
      let cartid = results[0].cart_id;
      console.log(cartid);
      if (results != undefined) {
        con.query(
          `insert into payment(cart_id)values(?)`,
          cartid,
          function (error, results, fields, rows) {
            con.query(
              `select payment_id from payment where cart_id=${cartid}`,
              function (error, results, fields, rows) {
                let len = results.length;
                let paymentid = results[len - 1].payment_id;
                con.query(
                  `select product_id from cart_item where cart_id=${cartid}`,
                  function (error, results, fields, rows) {
                    productid = [];
                    for (let j = 0; j < results.length; j++) {
                      productid.push(results[j].product_id);
                    }

                    let values = [];
                    let val = [];
                    for (let i = 0; i < productid.length; i++) {
                      val.push(paymentid, cartid, productid[i]);
                      values.push(val);
                      val = [];
                    }

                    con.query(
                      "insert into orders(payment_id,cart_id,product_id)values ?",
                      [values],
                      function (error, results, fields, rows) {
                        if (error) throw error;
                        res.redirect("/orders");
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    }
  );
});
app.get("/showOrders", (req, res) => {
  con.query(
    `select p.product_name,p.cost,o.payment_id,u.UName from products p,orders o,cart c,user_profile u where o.product_id=p.product_id and c.cart_id=o.cart_id and c.userid=u.userid;`,
    function (error, results, fields, rows) {
      if (error) throw error;
      res.render("showOrders.ejs", {
        result: results,
      });
    }
  );
});

app.get("/modifyProducts", (req, res) => {
  con.query("select * from products", function (error, results, fields, rows) {
    res.render("modifyProducts.ejs", {
      result: results,
    });
  });
});
app.get("/edit/:id", (req, res) => {
  con.query(
    `select * from products where product_id=${req.params.id}`,
    function (error, results, fields, rows) {
      res.render("editProduct.ejs", {
        result: results,
      });
    }
  );
});
app.post("/edit-form/:id", (req, res) => {
  let samplefile;
  let uploadPath;
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded");
  }
  samplefile = req.files.img;
  uploadPath = __dirname + "/uploads/" + samplefile.name;
  samplefile.mv(uploadPath, function (err) {
    if (err) res.status(500).send(err);
  });
  var product_name = req.body.pname;
  var description = req.body.description;
  var price = req.body.cost;
  var type = req.body.select_product;
  var id = req.params.id;
  var sql = `UPDATE products SET product_name="${product_name}", description="${description}", cost="${price}" ,Type="${type}",product_image="${samplefile.name}" WHERE product_id=${id}`;

  con.query(sql, function (err, result) {
    if (err) throw err;
    res.redirect("/modifyProducts");
  });
});
app.get("/delete-product/:id", (req, res) => {
  con.query(
    `delete from products where product_id=${req.params.id}`,
    function (error, results, fields, rows) {
      if (error) throw error;
      res.redirect("/modifyProducts");
    }
  );
});
app.get("/showUsers", (req, res) => {
  con.query(
    "select * from user_profile",
    function (error, results, fields, rows) {
      res.render("showUsers.ejs", {
        result: results,
      });
    }
  );
});

app.get("/addServices", (req, res) => {
  if (req.session.adminlogin == true) {
    res.render("addServices.ejs", {
      msg: "",
    });
  } else {
    res.redirect("login");
  }
});
app.post("/addServices", (req, res) => {
  let samplefile;
  let uploadPath;
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded");
  }
  samplefile = req.files.img;
  uploadPath = __dirname + "/uploads/" + samplefile.name;
  samplefile.mv(uploadPath, function (err) {
    if (err) res.status(500).send(err);
  });
  try {
    let sname = req.body.sname;
    let description = req.body.description;
    let cost = req.body.cost;
    con.query(
      "insert into services(service_name,description,price,service_image)values(?,?,?,?)",
      [sname, description, cost, samplefile.name],
      function (error, results, fields, rows) {
        res.render("addServices.ejs", {
          msg: "Service added Successfully",
        });
      }
    );
  } catch (error) {
    res.redirect("addServices", {
      msg: "",
    });
  }
});
app.get("/services", (req, res) => {
  con.query("select * from services", function (error, results, fields, rows) {
    res.render("services.ejs", {
      result: results,
    });
  });
});

app.post("/services/:id", (req, res) => {
  con.query(
    `insert into booking(service_id,userid)values(${req.params.id},${req.session.userid})`,
    function (error, results, fields, rows) {
      if (error) throw error;
      res.send("<h1>Booked Successfully</h1>");
    }
  );
});
app.get("/bookedServices", (req, res) => {
  con.query(
    "select s.service_name,s.description,s.price,u.UName from services s,booking b,user_profile u where b.service_id=s.service_id and b.userid=u.userid",
    function (error, results, fields, rows) {
      res.render("showServices.ejs", {
        result: results,
      });
    }
  );
});
app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});
