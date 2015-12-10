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
    Message.find({ locationKey : locationId })
        .sort({ timeStamp : 'asc' })
        .limit(25)
        .populate('userKey')
        .exec(function(err, messages) {
            messages.forEach(function(message) {
                var socket = io.sockets.connected[socketid];
                socket.emit('new message', {
                                username: message.userKey.displayName,
                                message: message.body,
                                timestamp: message.timeStamp,
                                id : message._id
                            });
        });
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
                            
                            broadcastToPostalCode(postalCode, 'new message', {
                                username: socket.request.user.displayName,
                                message: message.body,
                                timestamp: message.timeStamp,
                                id : message._id
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