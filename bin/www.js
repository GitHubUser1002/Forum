#!/usr/bin/env node
var debug = require('debug')('Forum');

process.on('uncaughtException', function (err) {
    console.log(err);
});

var app = require('../app');

//app.set('port', process.env.PORT || 3000);

//var server = app.listen(app.get('port'), function() {
//    console.log('Express server listening on port ' + server.address().port);
//});

app.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:'+(process.env.PORT || 3000));
});