var usernames = {};
var numUsers = 0;

function onAddedUser(socket, username) {
    socket.username = username;
    usernames[username] = username;
    ++numUsers;
    addedUser = true;
    console.log(socket.username + ' was added');

    socket.broadcast.emit('user joined', {
        username: socket.username,
        numUsers: numUsers
    });
}

function onTyping(socket) {
    socket.broadcast.emit('typing', {
        username: socket.username
    });
}

function onStoppedTyping(socket) {
    socket.broadcast.emit('stop typing', {
        username: socket.username
    });
}

function onNewMessage(socket, data) {
    socket.broadcast.emit('new message', {
        username: socket.username,
        message: data
    });
}

function onDisconnect(socket) {
    if (usernames[socket.username]) {
        delete usernames[socket.username];
        --numUsers;

        socket.broadcast.emit('user left', {
            username: socket.username,
            numUsers: numUsers
        });
    }
}

module.exports = {
    onConnection :  function (socket) {
                        //for (var key in socket.request.user) console.log(key);
                        console.log(socket.request.user);
        
                        socket.on('add user', function(username) { onAddedUser(socket, username); });

                        socket.on('typing', function () { onTyping(socket); });

                        socket.on('stop typing', function () { onStoppedTyping(socket) });

                        socket.on('new message', function (data) { onNewMessage(socket, data); });

                        socket.on('disconnect', function () { onDisconnect(socket); });
                    }
};