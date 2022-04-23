const socket = io();

/* --------------- Partition: Call Div --------------- */

const call = document.querySelector("#call");
const myFace = document.querySelector("#myFace");
const muteBtn = document.querySelector("#muteBtn");
const cameraBtn = document.querySelector("#cameraBtn");
const cameraList = document.querySelector("#cameraList");

let myStream;
let mute = false;
let camera = true;
let roomName;
let myPeerConnection;
let myDataChannel;

call.hidden = true;

const getCameras = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const current = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(current.label === camera.label) option.selected = true;
            cameraList.appendChild(option);
        });
    } catch (error) {
        console.log(error);
    }
};

const getMedia = async (deviceId) => {
    const initial = {
        audio: true,
        video: { facingMode: "user" }
    };
    const changed = {
        audio: true,
        video: { deviceID: { exact: deviceId } }
    }
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? changed : initial
        );
        myFace.srcObject = myStream;
        if (!deviceId) await getCameras();
    } catch (error) {
        console.log(error);
    }
};

const initCall = async () => {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

const handleMuteClick = () => {
    myStream.getAudioTracks().forEach((track) => track.enabled = !track.enabled);
    if (!mute) muteBtn.innerText = "Unmute";
    else muteBtn.innerText = "Mute";
    mute = !mute;
};

const handleCameraClick = () => {
    myStream.getVideoTracks().forEach((track) => track.enabled = !track.enabled);
    if (!camera) cameraBtn.innerText = "Camera Off";
    else cameraBtn.innerText = "Camera On";
    camera = !camera;
};

const handleCameraChange = async () => {
    await getMedia(cameraList.value);
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kine === "video");
        videoSender.replaceTrack(videoTrack);
    }
};

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraList.addEventListener("input", handleCameraChange);



/* --------------- Partition: Welcome Div --------------- */

const welcome = document.querySelector("#welcome");
const welcomeForm = welcome.querySelector("form");

const handleWelcomeSummit = async (event) => {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("enter_room", input.value);
    roomName = input.value;
    input.value = "";
};

welcomeForm.addEventListener("submit", handleWelcomeSummit);



/* --------------- Partition: Socket Events --------------- */

socket.on("welcome", async () => {
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", (event) => console.log(event.data)); /* Send and Receive Messages Using myDataChannel.send("...") */
    console.log("Set Data Channel");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
    console.log("Sent an Offer");
});

socket.on("offer", async (offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", (event) => console.log(event.data));
    });
    myPeerConnection.setRemoteDescription(offer);
    console.log("Received an Offer");
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("Sent an Answer");    
});

socket.on("answer", (answer) => {
    myPeerConnection.setRemoteDescription(answer);
    console.log("Received an Answer");
});

socket.on("ice", (ice) => {
    console.log("Received ICE candidate");
    myPeerConnection.addIceCandidate(ice);
    console.log("Added ICE candidate");
});



/* --------------- Partition: RTC Codes --------------- */

const makeConnection = () => {
    /* makeConnection() is used instead of addStream() */
    /* myPeerConnection = new RTCPeerConnection(); */

    /* Google STUN Servers → Do Not Use Them In Real Application */
    myPeerConnection = new RTCPeerConnection({
        iceServers: [{
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
              "stun:stun3.l.google.com:19302",
              "stun:stun4.l.google.com:19302"
            ]
          }]
      });

    myPeerConnection.addEventListener("icecandidate", handleICE);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
    console.log("Set myPeerConnection");
};

const handleICE = (data) => {
    console.log("Got ICE candidate");
    socket.emit("ice", data.candidate, roomName);
    console.log("Sent ICE candidate");
};

const handleAddStream = (data) => {
    console.log("Got Peer's Stream");
    console.log("Peer's Stream", data.stream);
    console.log("My Stream", myStream);
    const peerFace = document.querySelector("#peerFace");
    peerFace.srcObject = data.stream;;
};