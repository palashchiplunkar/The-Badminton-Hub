module.exports = {
  loginCheck: async (req, res) => {
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
  },
};
