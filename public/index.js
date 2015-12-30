function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(sendPosition);
    } else { 
        alert("Geolocation is not supported by this browser.");
    }
}

function sendPosition(position) {
    //alert(position.coords);
    
    $.ajax({
        url: '/RecordPosition',
        type: 'post',
        dataType: 'json',
        data: position.coords
    });
}

$(document).ready(function () {
    getLocation();
});