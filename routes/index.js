var express = require('express');
var router = express.Router();
var passport = require('passport');
var config = require('../config');
var authentication = require('../authentication');

/* GET home page. */
router.get('/', function (req, res) {
    console.log(req);
    res.render('index', { title: 'Express' });
});

module.exports = router;