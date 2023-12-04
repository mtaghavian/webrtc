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

var id = window.localStorage.getItem("MyID");
if (id == null) {
    id = "a" + crypto.randomUUID().replaceAll("-", "");
    window.localStorage.setItem("MyID", id);
}
console.log("MyID: " + id);
var room = "myroom";
var conn = new WebSocket(((window.location.protocol === "http:") ? "ws" : "wss") + "://" + window.location.host + "/webrtc");
var webcamStream = null;
var myVideo;
var connected = false;
var peerConnections = {};
var peerVideos = {};

function send(message) {
    conn.send(JSON.stringify(message));
}

function setVideoCSS(video) {
    video.style.display = "inline-bock";
    video.style.width = "160px";
    video.style.padding = "10px";
}

conn.onmessage = function (msg) {
    var content = JSON.parse(msg.data);
    console.log(content.op);
    let otherId = content.from;
    switch (content.op) {
        case "hi":
            if(otherId.localeCompare(id) > 0) {
                let pcon = new RTCPeerConnection(configuration);
                pcon.addEventListener("icecandidate", function (event) {
                    if (event.candidate) {
                        send({op: "candidate", room: room, from: id, to: otherId, payload: JSON.stringify(event.candidate)});
                    }
                });
                pcon.addEventListener("addstream", function (event) {
                    let otherVideo = document.createElement('video');
                    otherVideo.setAttribute("id", "Video" + otherId);
                    otherVideo.autoplay = true;
                    otherVideo.srcObject = event.stream;
                    setVideoCSS(otherVideo);
                    $("#MainDiv").append(otherVideo);
                });
                pcon.addStream(webcamStream);
                pcon.createOffer(function (offer) {
                    pcon.setLocalDescription(offer);
                    send({op: "offer", room: room, from: id, to: otherId, payload: JSON.stringify(offer)});
                }, function (err) {
                    console.log("Error creating an offer");
                });
                peerConnections[otherId] = pcon;
                //console.log(peerConnections);
            } else {
                conn.send(JSON.stringify({op: "hi", from: id, to: otherId, room: room}));
            }
            break;
        case "offer":
            let pcon = new RTCPeerConnection(configuration);
            pcon.addEventListener("icecandidate", function (event) {
                console.log("icecandidate");
                if (event.candidate) {
                    send({op: "candidate", room: room, from: id, to: otherId, payload: JSON.stringify(event.candidate)});
                }
            });
            pcon.addEventListener("addstream", function (event) {
                console.log("addstream");
                let otherVideo = document.createElement('video');
                otherVideo.setAttribute("id", "Video" + otherId);
                otherVideo.autoplay = true;
                otherVideo.srcObject = event.stream;
                setVideoCSS(otherVideo);
                document.getElementById("MainDiv").append(otherVideo);
            });
            pcon.addStream(webcamStream);
            pcon.setRemoteDescription(new RTCSessionDescription(JSON.parse(content.payload)));
            pcon.createAnswer(function (answer) {
                pcon.setLocalDescription(answer);
                send({op: "answer", room: room, from: id, to: otherId, payload: JSON.stringify(answer)});
            }, function (err) {
                console.log("Error creating an answer");
            });
            peerConnections[otherId] = pcon;
            break;
        case "answer":
            peerConnections[otherId].setRemoteDescription(new RTCSessionDescription(JSON.parse(content.payload)));
            break;
        case "candidate":
            peerConnections[otherId].addIceCandidate(new RTCIceCandidate(JSON.parse(content.payload)));
            break;
        case "bye":
            let parent = document.getElementById("MainDiv");
            let video = document.getElementById("Video" + otherId);
            parent.removeChild(video);
            delete(peerConnections[otherId]);
            break;
        default:
            break;
    }
};

conn.onopen = function () {
    connected = true;
    console.log("connected!");
    if(webcamStream != null) {
        conn.send(JSON.stringify({op: "hi", from: id, to: null, room: room}));
    }
};

navigator.mediaDevices.getUserMedia(mediaConstraints).then(function (stream) {
    webcamStream = stream;
    if(connected) {
        conn.send(JSON.stringify({op: "hi", from: id, to: null, room: room}));
    }

    myVideo = document.createElement('video');
    myVideo.setAttribute("id", "MyVideo");
    myVideo.autoplay = true;
    myVideo.muted = true;
    myVideo.srcObject = stream;
    setVideoCSS(myVideo);
    document.getElementById("MainDiv").append(myVideo);

}).catch(function (err) {
    console.log("Could not get camera stream!");
});