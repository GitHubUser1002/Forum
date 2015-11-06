var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('client-sessions');
var config = require('./config');

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var GOOGLE_CLIENT_ID = config.googleClientId;
var GOOGLE_CLIENT_SECRET = config.googleClientSecret;

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {    
    done(null, obj);
});

var User = require('./models/user.js');

var mongoose = require('mongoose');
var db = mongoose.connect(config.dbConnectionString);

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
  function (accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
        process.nextTick(function () {
            User.findOne({ emailAddress: profile.emails[0].value, strategy: 'Google' }, function (err, user) {
                if (err) {
                    console.log(err); 
                }
                else if (user) {
                    console.log(user.displayName + ' logged in!'); // Space Ghost is a talk show host.
                }
                else {
                    var newUser = new User({
                        strategy : 'Google',
                        emailAddress : profile.emails[0].value,
                        displayName : profile.displayName
                    });
                    newUser.save(function (err) {
                        if (!err) {
                            console.log('New user created');
                            console.log(newUser);
                        } 
                        else console.log(err);
                    });
                }      
            });
    });
    
    // To keep the example simple, the user's Google profile is returned to
    // represent the logged-in user.  In a typical application, you would want
    // to associate the Google account with a user record in your database,
    // and return that user instead.

    return done(null, profile);
}
));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    cookieName: 'session',
    secret: config.secret,
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
}));

app.use(passport.initialize());
app.use(passport.session());

var index = require('./routes/index');
app.use('/', index);
var login = require('./routes/login');
app.use('/', login);
var account = require('./routes/account');
app.use('/', account);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;