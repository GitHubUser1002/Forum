var socket = io();

$('form').submit(function(){
    socket.emit('new message', $('#m').val());
    $('#m').val('');
    return false;
});

socket.on('new message', function(msg){
    $('#messages').append($('<li>').text(msg));
});

socket.on('user joined', function (data) {

});

socket.on('user left', function (data) {

});

socket.on('typing', function (data) {

});

socket.on('stop typing', function (data) {

});

function addUser(usernameInput) {
    username = cleanInput(usernameInput.val().trim());

    if (username) {
      socket.emit('add user', username);
    }
}

var typing = false;
var lastTypingTime;
var TYPING_TIMER_LENGTH = 400; // ms
function updateTyping () {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
}

$('#m').on('input', function() {
    updateTyping();
});

$('#m').click(function () {
    $('#m').focus();
});