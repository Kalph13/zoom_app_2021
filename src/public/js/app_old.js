const socket = io();

const welcome = document.querySelector("#welcome");
const form = welcome.querySelector("form");
const room = document.querySelector("#room");

room.hidden = true; /* Don't Need to Use CSS for Hidden Class */

let roomName = "";

const showRoom = (name, count) => {
    welcome.hidden = true;
    room.hidden = false;
    showMessage(`You Successfully Joined the Room '${name}'`);
    const h3 = room.querySelector("h3");
    h3.innerText = `Room '${roomName}' (${count})`;
    const formNickname = room.querySelector("#formNickname");
    const formMessage = room.querySelector("#formMessage");
    formNickname.addEventListener("submit", handleNicknameSubmit);
    formMessage.addEventListener("submit", handleMessageSubmit);
};

const showRoomList = (roomList) => {
    const ul = welcome.querySelector("ul");
    ul.innerHTML = "";
    roomList.forEach((room) => {
        const li = document.createElement("li");
        li.innerText = `${room.roomName} (${room.roomCount})`;
        ul.appendChild(li);
    });
};

const showMessage = (message) => {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

const handleRoomSubmit = (event) => {
    event.preventDefault();
    const input = form.querySelector("input");
    socket.emit("enter_room", input.value, showRoom); /* Event Name Can be Any String */ /* Can Emit Not Only Strings, But Also Objects */
    roomName = input.value;
    input.value = "";
};

const handleNicknameSubmit = (event) => {
    event.preventDefault();
    const input = formNickname.querySelector("input");
    const text = input.value;
    socket.emit("nickname", text, roomName, () => showMessage(`You set a new nickname: ${text}`));
    input.value = "";
}

const handleMessageSubmit = (event) => {
    event.preventDefault();
    const input = formMessage.querySelector("input");
    const text = input.value;
    socket.emit("message", text, roomName, () => showMessage(`You: ${text}`));
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (nickname, count) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room '${roomName}' (${count})`;
    showMessage(`${nickname} has joined!`);
});

socket.on("leave_room", (nickname, count) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room '${roomName}' (${count})`;
    showMessage(`${nickname} has left`);
});

socket.on("message", (nickname, message) => showMessage(`${nickname}: ${message}`));
socket.on("nickname", (prevName, nickname) => showMessage(`${prevName} set a new nickname: ${nickname}`));
socket.on("roomlist", (roomList) => showRoomList(roomList));

/* 'server' Represents the Connection to the Server */
/* const socket = new WebSocket(`ws://${window.location.host}`); 

const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#formMessage");
const nameForm = document.querySelector("#formName");

socket.addEventListener("open", () => {
    console.log("Connected to Server");
});

socket.addEventListener("message", (message) => {
    const messageText = document.createElement("li");
    messageText.innerText = message.data;
    messageList.appendChild(messageText);
    console.log("Message from the Server:", message.data);
});

socket.addEventListener("close", () => {
    console.log("Disconnected from the Server");
});

const handleSubmit = (event) => {
    event.preventDefault();
    const messageInput = messageForm.querySelector("input");
    socket.send(
        JSON.stringify({
            type: "text",
            payload: messageInput.value
        })
    );
    console.log("Message to the Server:", messageInput.value);
    messageInput.value = "";
};

const handleName = (event) => {
    event.preventDefault();
    const nameInput = nameForm.querySelector("input");
    socket.send(
        JSON.stringify({
            type: "name",
            payload: nameInput.value
        })
    );
    console.log("Nickname to the Server", nameInput.value);
    nameInput.value = "";
}

messageForm.addEventListener("submit", handleSubmit);
nameForm.addEventListener("submit", handleName); */

/* setTimeout(() => {
    socket.send("Hello from the Browser!");
    console.log("Message to the Server: Hello from the Browser!");
}, 5000); */