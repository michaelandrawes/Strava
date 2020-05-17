//jshint esversion:6

const express = require("express");
const cookieParser=require('cookie-parser');
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require('express-session');
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy=require('passport-local').Strategy;
const passportLocalMongoose = require("passport-local-mongoose");
// const StravaStrategy = require('passport-strava-oauth2').Strategy;
const findOrCreate = require('mongoose-findorcreate');
var StravaStrategy = require('passport-strava').Strategy;

const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));

app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());


app.use(session({
  secret: "starva .",
  resave: false,
  saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/stravaDB", {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);


const userSchema = new mongoose.Schema ({
  disname:String,
  email:String,
  stravaId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);



passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


app.get('*',(req,res,next)=>{
  res.locals.user=req.user||null;
  next();
});


// passport.use(new StravaStrategy({
//     clientID: "46991",
//     clientSecret: "8866cc9e3c7770642b5e1250d7201d016599ba04",
//     callbackURL: "http://localhost:3000/auth/strava/index"
//   },
//   function(accessToken, refreshToken, profile, done) {
//     console.log(profile);
//
//     User.findOrCreate({ stravaId: profile.id, disname:profile.displayName,email:profile.emails }, function (err, user) {
//       return cb(err, user);
//     });
//     // asynchronous verification, for effect...
//     // process.nextTick(function () {
//
//       // To keep the example simple, the user's Strava profile is returned to
//       // represent the logged-in user.  In a typical application, you would want
//       // to associate the Strava account with a user record in your database,
//       // and return that user instead.
//     //   return done(null, profile);
//     // });
//
//
//   }
// ));
//





passport.use(new StravaStrategy({
  clientID: '48128',
  clientSecret: '8b453fb3be92d63d9bf6904a5bacc137cbaaf488',
    callbackURL: "http://127.0.0.1:3000/auth/strava/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ stravaId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

// GET /auth/strava
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Strava authentication will involve
//   redirecting the user to strava.com.  After authorization, Strava
//   will redirect the user back to this application at /auth/strava/callback
app.get('/auth/strava',
  passport.authenticate('strava', { scope: ['public'] }),
  function(req, res){
    // The request will be redirected to Strava for authentication, so this
    // function will not be called.
  });

// GET /auth/strava/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/strava/callback',
  passport.authenticate('strava', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});



// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}


app.listen(process.env.PORT||3000,function(){
  console.log('app is running on 3000');
});
