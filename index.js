require("./models/db");

const express = require("express");
const router = express.Router();
const path = require("path");
const exphbs = require("express-handlebars");
const bodyparser = require("body-parser");

var cookieParser = require('cookie-parser');
var session = require('express-session');
const url = require('url'); 

const mongoose = require("mongoose");
const Invoice = mongoose.model("Invoice");
const Customer = mongoose.model("Customer");
const User = mongoose.model("User")

const customerController = require("./controllers/customerController");
const invoiceController = require("./controllers/invoiceController");
const emailController = require("./controllers/emailController");
const userController = require("./controllers/userController");

const middleware = require("./middlewares/login");
const { log } = require("console");

const app = express();

app.use(
  bodyparser.urlencoded({
    extended: true
  })
);
app.use(bodyparser.json());
app.set("views", path.join(__dirname, "/views/"));
app.engine(
  "hbs",
  exphbs({
    extname: "hbs",
    defaultLayout: "mainLayout",
    layoutsDir: __dirname + "/views/layouts/"
  })
);
app.set("view engine", "hbs");
app.use(express.static("public"));



// app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
// app.use(session({
//   key: 'user_sid',
//   secret: 'somerandonstuffs',
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     expires: 600000
//   }
// }));

app.use(session({ 
  secret: "xYUCAchitkaraa",
  saveUninitialized: true,
  resave: true,
  cookie: { 
    expires: 3600000 
  }
}));



// app.use(middleware);


app.get("/dashboard", middleware , async (req, res) => {
  if(req.session.role == 'admin'){
    let list = [];
    list.result = await Invoice.countDocuments({ isPaid: "False" });
    list.result2 = await Invoice.countDocuments({ isPaid: "True" });
    list.result3 = await Invoice.countDocuments({});
    list.result4 = await Customer.countDocuments({});
    list.result5 = await Invoice.find({ isPaid: "False" });
    res.render("dashboard", list);
  }else{
    res.render("error",{
      msg:"Not Authorized",
      redirect:"/user"
    })
  }
});

var port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

app.get('/', function (req, res) {
  // res.send("Hi");
  console.log(req.session);
  if (req.session.isLogin == 1) {
    if(req.session.role == 'admin'){
      res.redirect("/dashboard");
    }else{
      res.redirect("/user");
    }
  }else{
    res.sendFile(__dirname+"/public/index1223.html");
  }
});

app.post("/login",(req,res)=>{

  User.findOne({email:req.body.email}).then(user=>{
    if(user){
      if(user.password == req.body.password){

        req.session.isLogin = 1;
        req.session.id = user._id;
        req.session.email = user.email;
        req.session.role = user.role;
        // res.send(data);

        console.log("Session Created");

        if(req.session.role == "admin"){
          res.redirect("/dashboard");
        }else{
        res.redirect(url.format({
          pathname : "/user",
          query : {  
            "email":req.body.email
          }
        }));
      }
      }else{
        res.render("error", {
          msg: "Password or email Incorrect",
          redirect:"/"
        })
      }
    }else{
      res.render("error",{
        msg: "User with specified email doesn't exist",
        redirect:"/"
      });
    }
  }
  );
});

app.post("/signin",(req,res)=>{

  User.findOne({email:req.body.email}).then(users=>{

    if(!users){
      var user = new User();
      user.email = req.body.email;
      user.password = req.body.password;
      user.verified = "false";
      user.role = "user";

      user.save((err, doc) => {
        if (!err) {
          console.log("User Saved");
          res.redirect("/");
        } else {
          console.log(err);
        }

      });
    }else{
      res.render("error",{
        msg:"Email already exists"
      });
    }
  });
});


app.use("/customer",middleware ,customerController);

app.use("/invoice", middleware ,invoiceController);

app.use("/email", middleware ,emailController);

app.use("/user",userController);

app.get("/logout",(req,res)=>{
  req.session.isLogin = 0;
  console.log(req.session.role);
  res.redirect("/");
});