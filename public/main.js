var socket = io();

$(document).ready(function () {
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            if ($('.scrollup').css("visibility") != "hidden") {
                $('.scrollup').hide();
            }
        } else {
            $('.scrollup').fadeIn(750, function() { });
        }
    });
    
    if ($("body").height() < $(window).height()) {
        $('.scrollup').fadeIn(2000);
    }

    $('.scrollup').click(function () {
        getOlderMessages();
        return false;
    });

});

$('#m').keypress(function (e) {
    if (e.which == 13) {
        emitNewMessage();
    }
});

function emitNewMessage() {
     socket.emit('new message', {
        message: $('#m').text(),
        parentMessageId: null
    });

    $('#m').text('');
}

$('form').submit(function(){
    emitNewMessage();
    
    return false;
});

function updateScroll(){
    $("#body").animate({ scrollTop: $("#messageContainer").height() }, 0);
}

function getMessageCount (id, callback) {
     socket.emit('messageCount',  { parentMessageId : id }, function (data) {
         callback(data, id);
     });
};

function getChildMessages (id, callback) {
     socket.emit('childMessages',  { parentMessageId : id }, function (data) {
         callback(data);
     });
};

function getOlderMessages (id, date, callback) {
     if ($('#messages').children().first().attr('date')) {
         socket.emit('getOldMessages',  { cutoffdate : $('#messages').children().first().attr('date') }, function (data) {
             for (var idx in data) {
                 var payload = data[idx];
                 
                 var div = $('<div>');
                 $('#messages').prepend(
                 $('<li>').attr({"id":payload.id, "date":payload.timestamp})
                    .append(div
                    .attr(
                        {
                            "class":"well",
                            "style":"display:none"
                        }
                    )));
                    div.hide().fadeIn(1500);
                    appendEntry($('#messages').find($('#'+payload.id)), div, payload.id, null, payload.username, payload.timestamp, payload.message);
                 
                    if (!$("#"+payload.id).find(".responseStatus").length) {
                        $("#"+payload.id).append($('<div class=responseStatus id=responseStatus'+payload.id+'>'));
                }  
                 
                $("#"+payload.id).append($('<div class=responses>'));
                 
                var callback = function(data, id) {
                    var responses = $("#"+id).find(".responses");
                    
                    responses.hide();
                    var toggled = false;
                    var displayed = false;
                    var loaded = false;
                    var toggleResponsesVisibility = function () {
                        if (!toggled)
                        {
                            getChildMessages(id, function(data) {
                                for (var idx = 0; idx < data.length; idx++){
                                    var item = data[idx];

                                    if($("#"+item.parentId).find($(".responses")).length) {
                                        appendEntry($("#"+item.parentId).find($(".responses")), $('<div>').attr(
                                                {
                                                    "class":"well",
                                                    "style":"display:none",
                                                    "id":item.id,
                                                    "parentid":item.parentid
                                                }
                                            ).hide().fadeIn(1), item.id, item.parentId, item.username, item.timestamp, item.message);
                                    }
                                }
                                loaded = true;

                            });
                            toggled = true;
                        }

                        if (!displayed)
                        {
                            if (loaded)
                                responses.slideDown();
                            else
                                responses.show();

                            displayed = true;
                            $("#"+id).find(".showResponse").text("Hide responses");
                        }
                        else
                        {
                            responses.slideUp();
                            displayed = false;
                            $("#"+id).find(".showResponse").text("Show responses");
                        }    
                    };
                   
                    $("#responseStatus"+id).append($('<a class=showResponse>').text('Show responses').click(toggleResponsesVisibility)).append($('<span style=margin-left:5px class=badge>').text(data));
                };
                 
               getMessageCount(payload.id, callback);
             }
         });
     }
};

socket.on('messageCountUpdate', function(payload) {
     $("#"+payload.id).find(".badge").text(payload.responseCount);
});

function appendEntry(parentelement, newelement, id, parentid, username, timestamp, message) {
    parentelement
                .append(newelement
                    .append($('<div>')
                        .attr(
                            {
                                "class":"label"
                            }
                        )
                        .append($('<span class="name">').text(username))
                        .append($('<span class="time">').text(timestamp))
                    )
                    .append($('<div>').text(message))
                    .click(function() { 
                        if(parentid) { showResponseEntry(parentid); }
                        else { showResponseEntry(id); } 
                    })
                 )
}

function handleChildMessage(payload) {
    appendEntry($("#"+payload.parentid).find($(".responses")), $('<div>').attr(
                        {
                            "class":"well",
                            "style":"display:none",
                            "id":payload.id,
                            "parentid":payload.parentid
                        }
                    ).hide().fadeIn(1500), payload.id, payload.parentid, payload.username, payload.timestamp, payload.message);
}

function appendParentMessage(payload) {
    var div = $('<div>');
    $('#messages').append(
            $('<li>').attr({"id":payload.id, "date":payload.timestamp})
                .append(div
                    .attr(
                        {
                            "class":"well",
                            "style":"display:none"
                        }
                    )));
    div.hide().fadeIn(1500);
    appendEntry($('#messages').find($('#'+payload.id)), div, payload.id, null, payload.username, payload.timestamp, payload.message);
}

socket.on('new message', function(payload){
    if (payload.parentid) {
        if($("#"+payload.parentid).find($(".responses")).length) {
            handleChildMessage(payload);
            
            return;
        }
    }
    
    appendParentMessage(payload);
    
    if (!$("#"+payload.id).find(".responseStatus").length) {
        $("#"+payload.id).append($('<div id=responseStatus'+payload.id+'>'));
    }
    
    getMessageCount(payload.id, function(data) {
        $("#"+payload.id).find("#responseStatus"+payload.id).append($('<a class=showResponse>').text('Show responses').click(toggleResponsesVisibility)).append($('<span style=margin-left:5px class=badge>').text(data));
        updateScroll();
    });
    
    $("#"+payload.id).append($('<div class=responses>'));
    
    var responses = $("#"+payload.id).find(".responses");
    responses.hide();
    var toggled = false;
    var displayed = false;
    var loaded = false;
    var toggleResponsesVisibility = function () {
        if (!toggled)
        {
            getChildMessages(payload.id, function(data) {
                for (var idx = 0; idx < data.length; idx++){
                   var item = data[idx];
                   
                    if($("#"+item.parentId).find($(".responses")).length){
                        appendEntry($("#"+item.parentId).find($(".responses")), $('<div>').attr(
                                {
                                    "class":"well",
                                    "style":"display:none",
                                    "id":item.id,
                                    "parentid":item.parentid
                                }
                            ).hide().fadeIn(1), item.id, item.parentId, item.username, item.timestamp, item.message);
                        
                    }
                }
                loaded = true;
            });
            toggled = true;
        }
        
        if (!displayed)
        {
            if (loaded)
                responses.slideDown();
            else
                responses.show();
            
            displayed = true;
            $("#"+payload.id).find(".showResponse").text("Hide responses");
        }
        else
        {
            responses.slideUp();
            displayed = false;
            $("#"+payload.id).find(".showResponse").text("Show responses");
        }    
    };

});

function showResponseEntry(id) {
    if (!$("#"+id).find(".responseEntry").length) {

        $("#"+id)
            .append($('<div>').attr({ 'class':'responseEntry' })
                    .append($('<div>').attr({ 'class':'responseEntryContainer' }).append($('<span>').attr({ 'class':'inputMessageResponse', 'parentMessageId':id, 'contenteditable':"true" }))))

        var response = $("#"+id).find('.responseEntry');

        var close = function() {
            response.remove();
        };

        response.find('span').keypress(function (e) {
            if (e.which == 13) {
                socket.emit('new message', {
                    message: response.find('span').text(),
                    parentMessageId: id
                });

                close();
                return false;
            }
        });
    }
    else if ($("#"+id).find(".responseEntry").css('display') == 'none') {
        $("#"+id).find(".responseEntry").show();
    }
    else {
        $("#"+id).find(".responseEntry").hide();
    }
}

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