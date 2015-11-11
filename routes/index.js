var express = require('express');
var router = express.Router();
var passport = require('passport');
var config = require('../config');
var authentication = require('../authentication');

/* GET home page. */
router.get('/', function (req, res) {
    //console.log(req);
    res.render('index', { title: 'Express' });
});

router.get('/forum', function (req, res) {
    //console.log(req.user);
    var hostname = req.headers.host;
    res.render('forum', { title: 'forum', url : 'http://' + hostname.replace(':'+(process.env.PORT || 3000), '') });
});

module.exports = router;