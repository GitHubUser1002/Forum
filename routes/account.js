var express = require('express');
var router = express.Router();
var passport = require('passport');
var config = require('../config');
var authentication = require('../authentication');

router.get('/account', authentication.ensureAuthenticated, function (req, res) {
    res.json('hey!')
    //res.render('account', { user: req.user });
});

module.exports = router;