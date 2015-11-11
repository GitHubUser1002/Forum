var express = require('express');
var router = express.Router();

router.get('/public/main.js', function(req, res) {
    var hostname = req.headers.host; 
    console.log('http://' + hostname.replace(':'+(process.env.PORT || 3000), ''));
    res.sendFile(__dirname+'/../public/main.js'); 
});

module.exports = router;