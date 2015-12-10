var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Session = require('express-session');
var config = require('./config');

var mongoose = require('mongoose');
var db = mongoose.connect(config.dbConnectionString);

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

var sessionStore = new (require("connect-mongo")(Session))({
        //url: ''
        mongooseConnection: mongoose.connection
    });
var session = Session({
    cookieName: 'session',
    key:    config.key,
    secret: config.secret,
    resave: true,
    saveUninitialized: true,
    //duration: 30 * 60 * 1000,
    //activeDuration: 5 * 60 * 1000,
    store: sessionStore
});
app.use(session);

var http = require('http').Server(app);
 
var passport = require('./passportContext');
app.use(passport.initialize());
app.use(passport.session());

var io = require("socket.io")(http);

var passportEventHandlers = require('./passportEventHandlers');
var passportSocketIo = require("passport.socketio");
io.use(passportSocketIo.authorize({
    passport    :   passport,
    cookieParser:   cookieParser,       // the same middleware you registrer in express
    key         :   config.key,
    secret      :   config.secret,
    store       :   sessionStore,        // we NEED to use a sessionstore. no memorystore please
    success     :   passportEventHandlers.onAuthorizeSuccess,  // *optional* callback on success - read more below
    fail        :   passportEventHandlers.onAuthorizeFail,     // *optional* callback on fail/error - read more below
}));

io.use(function(socket, next){
    session(socket.handshake, {}, function(err){
        if (err) return next(err);     
        
        return next();
    });
});

var socketEventHandlers = require('./socketEventHandlers');
socketEventHandlers.initialize(io, mongoose);
io.on('connection', socketEventHandlers.onConnection);

var index = require('./routes/index');
app.use('/', index);
var login = require('./routes/login');
app.use('/', login);
var account = require('./routes/account');
app.use('/', account);
var public = require('./routes/public');
app.use('/', public);
console.log(__dirname);
app.use(express.static(__dirname + '/public'));

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

module.exports = http;