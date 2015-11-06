var express = require('express');
var router = express.Router();
var passport = require('passport');
var config = require('../config');

var User = require('../models/user.js');

router.get('/login', function (req, res) {
    res.render('login', { user: req.user });
});

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
router.get('/auth/google',
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/plus.profile.emails.read'] }),
    function (req, res) {
    // The request will be redirected to Google for authentication, so this
    // function will not be called.
});

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get('/auth/google/callback', 
    passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/');
});

module.exports = router;