var mediaConstraints = {
    audio: true,
    video: true
};
var configuration = {
    'iceServers': [
        {
            'urls': 'stun:stun.l.google.com:19302'
        }
    ]
};

var conn = new WebSocket(((window.location.protocol === "http:") ? "ws" : "wss") + "://" + window.location.host + "/socket");

function send(message) {
    conn.send(JSON.stringify(message));
}

conn.onmessage = function (msg) {
    var content = JSON.parse(msg.data);
    console.log(content);
    var data = content.data;
    switch (content.event) {
        case "call":
            call(true);
            break;
        case "init":
            call(false);
            break;
        case "initAnswer":
            myPeerConnection.createOffer(function (offer) {
                myPeerConnection.setLocalDescription(offer);
                send({event: "offer", data: offer});
            }, function (err) {
                console.log("Error creating an offer");
            });
            break;
        case "offer":
            myPeerConnection.setRemoteDescription(new RTCSessionDescription(data));
            myPeerConnection.createAnswer(function (answer) {
                myPeerConnection.setLocalDescription(answer);
                send({event: "answer", data: answer});
            }, function (err) {
                console.log("Error creating an answer");
            });
            break;
        case "answer":
            myPeerConnection.setRemoteDescription(new RTCSessionDescription(data));
            break;
        case "candidate":
            myPeerConnection.addIceCandidate(new RTCIceCandidate(data));
            break;
        default:
            break;
    }
};

conn.onopen = function () {
    console.log("connected!");
    conn.send("hello");
};

var myPeerConnection = null;
var webcamStream = null;

function call(isInit) {
    $("#WaitText").text("Connecting...");
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(function (stream) {
        webcamStream = stream;
        document.getElementById("local_video").srcObject = stream;
        myPeerConnection = new RTCPeerConnection(configuration);
        myPeerConnection.addEventListener("icecandidate", function (event) {
            if (event.candidate) {
                send({event: "candidate", data: event.candidate});
            }
        });
        myPeerConnection.addEventListener("addstream", function (event) {
            document.getElementById("received_video").srcObject = event.stream;
        });
        myPeerConnection.addStream(webcamStream);
        send(isInit ? {event: "init"} : {event: "initAnswer"});
        if($("#Wait").is(":visible")) {
            $("#Wait").hide();
            $("#CameraPanel").show();
        }
    }).catch(function (err) {
        console.log("Could not get camera stream!");
    });
}
