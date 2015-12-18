var socket = io();

$('form').submit(function(){
    socket.emit('new message', {
        message: $('#m').val(),
        parentMessageId: null
    });

    $('#m').val('');
    
    return false;
});

function updateScroll(){
    $("#body").animate({ scrollTop: $("#messageContainer").height() }, 0);
}

(function($) {
    $.fn.hasScrollBar = function() {
        return this.get(0).scrollHeight > this.height();
    }
})(jQuery);

function getMessageCount (id, callback) {
     socket.emit('messageCount',  { parentMessageId : id }, function (data) {
         callback(data);
     });
};

function getChildMessages (id, callback) {
     socket.emit('childMessages',  { parentMessageId : id }, function (data) {
         callback(data);
     });
};

socket.on('messageCountUpdate', function(payload) {
     $("#"+payload.id).find(".badge").text(payload.responseCount);
});

socket.on('new message', function(payload){
    //if($("#"+payload.id).length) return;
    
    if (payload.parentid) {
        if($("#"+payload.parentid).find($(".responses")).length){
            $("#"+payload.parentid).find($(".responses"))
                .append($('<div>')
                    .attr(
                        {
                            "class":"well",
                            "style":"display:none",
                            "id":payload.id,
                            "parentid":payload.parentid
                        }
                    ).hide().fadeIn(1500)
                    .append($('<div>')
                        .attr(
                            {
                                "class":"label"
                            }
                        )
                        .append($('<span class="name">').text(payload.username))
                        .append($('<span class="time">').text(payload.timestamp))
                    )
                    .append($('<div>').text(payload.message))
                    .click(function(){showResponseEntry()})
                 )
                //.append($('<span>').text(payload.message));
            return;
        }
    }
    
    $('#messages')
        .append(
            $('<li>').attr({"id":payload.id})
                .append($('<div>')
                    .attr(
                        {
                            "class":"well",
                            "style":"display:none"
                        }
                    ).hide().fadeIn(1500)
                    .append($('<div>')
                        .attr(
                            {
                                "class":"label"
                            }
                        )
                        .append($('<span class="name">').text(payload.username))
                        .append($('<span class="time">').text(payload.timestamp))
                    )
                    .append($('<div>').text(payload.message))
                    .click(function(){showResponseEntry()})
                 )
        );
    
    if (!$("#"+payload.id).find(".responseStatus").length)
    {
        $("#"+payload.id).append($('<div id=responseStatus'+payload.id+'>'));
    }
    
    getMessageCount(payload.id, function(data) {
        $("#"+payload.id).find("#responseStatus"+payload.id).append($('<a class=showResponse>').text('Show responses').click(toggleResponsesVisibility)).append($('<span style=margin-left:5px class=badge>').text(data));
    });
    
    $("#"+payload.id).append($('<div class=responses>'));
    
    var responses = $("#"+payload.id).find(".responses");
    responses.hide();
    var toggled = false;
    var display = false;
    var loaded = false;
    var toggleResponsesVisibility = function () {
        
        if (!toggled)
        {
            getChildMessages(payload.id, function(data) {
                for (var idx = 0; idx < data.length; idx++){
                   var item = data[idx];
                   
                   
                    if($("#"+item.parentId).find($(".responses")).length){
                        $("#"+item.parentId).find($(".responses"))
                            .append($('<div>')
                                .attr(
                                    {
                                        "class":"well",
                                        "style":"display:none",
                                        "id":item.id,
                                        "parentid":item.parentId
                                    }
                                ).hide().fadeIn(1)
                                .append($('<div>')
                                    .attr(
                                        {
                                            "class":"label"
                                        }
                                    )
                                    .append($('<span class="name">').text(item.username))
                                    .append($('<span class="time">').text(item.timestamp))
                                )
                                .append($('<div>').text(item.message))
                                .click(function(){showResponseEntry()})
                             )
                    }
                }
                loaded = true;
                
            });
            toggled = true;
        }
        
        if (!display)
        {
            if (loaded)
                responses.slideDown();
            else
                responses.show();
            
            display = true;
            $("#"+payload.id).find(".showResponse").text("Hide responses");
        }
        else
        {
            responses.slideUp();
            display = false;
            $("#"+payload.id).find(".showResponse").text("Show responses");
        }

        
    };
        
    var showResponseEntry = function() {
        if (!$("#"+payload.id).find($(".responseEntry")[0]).length) {
            $("#"+payload.id)
                .append($('<div>').attr({ 'class':'responseEntry' })
                            .append($('<input>').attr({ 'placeholder':"Type response here...", 'type':'text', 'class':'inputMessage', 'parentMessageId':payload.id }))
                            .append($('<button>').attr({ 'class':'btn btn-xs btn-default' }).text('X').click(function() { close() }))
                        )
                
            var response = $("#"+payload.id).find($('.responseEntry')[0]);
            var close = function() {
                response.remove();
            };
            
            response.find('input').keypress(function (e) {
                if (e.which == 13) {
                   socket.emit('new message', {
                        message: response.find('input').val(),
                        parentMessageId: payload.id
                   });

                   response.remove();
                   return false;
                }
            });
        }
    };

    updateScroll();
});

socket.on('user joined', function (data) {
    $('#messages').append($('<li>').text(data.username + ' joined'));
});

socket.on('user left', function (data) {
    $('#messages').append($('<li>').text(data.username + ' left'));
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