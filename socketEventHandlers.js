var Message = require('./models/message.js');
var User = require('./models/user.js');
var Location = require('./models/location.js');
var UserLocation = require('./models/userLocation.js');
var User = require('./models/user.js');

var socketBasket = {};
var io = null;
var mongoose = null;

function onUserConnect(socket, user, postalCode) {
    getLastPosts(socket.handshake.session.location._id, socket.id);
    
    broadcastToPostalCode(postalCode, 'user joined', { username : socket.handshake.session.user.displayName }, socket.id);
}

function getLastPosts(locationId, socketid) {
    Message.find({ locationKey : locationId, parentMessageKey : null })
        .sort({ timeStamp : -1 })
        .limit(5)
        .populate('userKey')
        .exec(function(err, messages) {
            var socket = io.sockets.connected[socketid];
             for (var idx = messages.length - 1; idx >= 0; idx--) {
                var message = messages[idx];
                 socket.emit('new message', {
                                username: message.userKey.displayName,
                                message: message.body,
                                timestamp: message.timeStamp,
                                id : message._id
                            });
             }
 
        });
}

function getLastPostsWithCutoff(locationId, cutoff, fn) {
    Message.find({ locationKey : locationId, parentMessageKey : null, timeStamp: {$lt: cutoff} })
        .sort({ timeStamp : -1 }) //-1 desc, 1 asc
        .limit(5)
        .populate('userKey')
        .exec(function(err, messages) {
            var payload = [];
        
            for (var idx in messages) {
                var message = messages[idx];
                
                 payload.push( {
                                username: message.userKey.displayName,
                                message: message.body,
                                timestamp: message.timeStamp,
                                id : message._id,   
                                prepend : 1
                            });
            }
            fn(payload);
        });
}

function getChildPosts(parentId, fn) {
    Message.find({ parentMessageKey : parentId })
        .sort({ timeStamp : 'asc' })
        .populate('userKey')
        .exec(function(err, messages) {
            var payload = [];
        
            for (var idx in messages) {
                var message = messages[idx];
                payload.push({
                   username: message.userKey.displayName,
                   message: message.body,
                   timestamp: message.timeStamp,
                   id : message._id,
                   parentId : message.parentMessageKey
               })
            }
        
            fn(payload);
    });
}

function broadcastToPostalCode(postalCode, topic, payload, omittedSocketID) {
    if (io != null)
        socketBasket[postalCode].forEach(function(to) {
            if (omittedSocketID && to === omittedSocketID) return;
            var socket = io.sockets.connected[to];
            if (socket)
                socket.emit(topic, payload);
        });
}

function onTyping(socket, postalCode) {
    broadcastToPostalCode(postalCode, 'typing', {
        username: socket.username
    });
}

function onStoppedTyping(socket, postalCode) {
    broadcastToPostalCode(postalCode, 'stop typing', {
        username: socket.username
    });
}

function onNewMessage(socket, data, user, postalCode) {
    var usr = socket.handshake.session.user;
    
    var message = new Message({ 
                        body : data.message,
                        locationKey : socket.handshake.session.location._id,
                        parentMessageKey : data.parentMessageId,
                        userKey : usr._id
                    });
    
        message.save(function (err) {
                        if (!err) {
                            console.log('Messsage saved');
                            
                            if (data.parentMessageId) {
                                Message.count({ parentMessageKey : data.parentMessageId }, function(err, c) {
                                    broadcastToPostalCode(postalCode, 'messageCountUpdate', {
                                        id              :   data.parentMessageId,
                                        responseCount    :   c
                                    });
                                }); 
                            }
                            
                            broadcastToPostalCode(postalCode, 'new message', {
                                username: socket.request.user.displayName,
                                message: message.body,
                                timestamp: message.timeStamp,
                                id : message._id,
                                parentid : message.parentMessageKey
                            });
                        } 
                        else console.log(err);
                    });
}

function onDisconnect(socket, user, postalCode) {
    if (socketBasket[postalCode][user.id]) {
        delete socketBasket[postalCode][user.id];

        broadcastToPostalCode(postalCode, 'user left', {
            username : socket.request.user.displayName
        });
    }
};

function subscribe(socket, user, postalCode) {
    if (!socketBasket[postalCode])
        socketBasket[postalCode] = [];

    socketBasket[postalCode].push(socket.id);

    onUserConnect(socket, user, postalCode);

    socket.on('typing', function () { onTyping(socket, postalCode); });

    socket.on('stop typing', function () { onStoppedTyping(socket, postalCode) });

    socket.on('new message', function (data) { onNewMessage(socket, data, user, postalCode); });

    socket.on('disconnect', function () { onDisconnect(socket, user, postalCode); });
    
    socket.on('messageCount', function (arg, fn) {
        Message.count({ parentMessageKey : arg.parentMessageId }, function(err, c) {
            fn(c);
        });
    });
    
    socket.on('childMessages', function (arg, fn) {
        getChildPosts(arg.parentMessageId, fn);
    });
    
    socket.on('getOldMessages', function (arg, fn) {
        var dt = new Date(arg.cutoffdate);
        console.log(dt);
        getLastPostsWithCutoff(socket.handshake.session.location._id, dt, fn);
    });
};

module.exports = {
    initialize  :   function(ioArg, mongooseArg) {
                        io = ioArg;
                        mongoose = mongooseArg;
                    },
    
    onConnection :  function (socket) {
                        var user = socket.request.user;  
        
                        if (!user) return;
        
                        User.findOne({ emailAddress: user.emails[0].value, strategy: 'Google' }, function (err, usr) {
                            if (!usr) return;
                            socket.handshake.session['user'] = usr;
                            UserLocation.findOne({ userKey : usr._id })
                            .populate('locationKey')
                            .exec(function(err, userLocation) {
                                if (!userLocation) return;

                                socket.handshake.session['location'] = userLocation.locationKey;
                                subscribe(socket, user, userLocation.locationKey.postalCode)
                            });
                        });
                    }
};