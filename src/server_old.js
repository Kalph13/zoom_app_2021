import http from "http";
import express from "express";

/* import WebSocket from "ws"; */
/* import SocketIO from "socket.io"; */ /* Before using SocketIO Admin */
import { Server } from "socket.io"; /* After using SocketIO Admin */
import { instrument } from "@socket.io/admin-ui";

const app = express(); /* Start a Server */

app.set("view engine", "pug"); /* Set View Engine as Pug */
app.set("views", `${__dirname}/views`); /* Set View Directory */
app.use("/public", express.static(`${__dirname}/public`)); /* Set a Static Middleware (First: Virtual Path, Second: → Directory of Static Files (Images, JS, etc.) */
app.get("/", (req, res) => res.render("home")); /* Respond from the Root URL → Render 'home.pug' */
app.get("/*", (req, res) => res.redirect("/")); /* Redirect to '/' for All SubURLs */

const server = http.createServer(app); /* Create HTTP Server (Warning: Name Matters! → Must not be 'Server') */

/* const wss = new WebSocket.Server({ server }); */ /* Create Websockets Server and Connect with the HTTP Server (Both HTTP and Websockets Run on the Same Port 3000) */
/* const io = SocketIO(server); */ /* Before using SocketIO Admin */
const io = new Server(server, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
    }
}); /* After using SocketIO Admin */

instrument(io, {
    auth: false
});

const sockets = []; /* 'socket' Represents the Connected Browser */

const publicRooms = () => {
    const { sockets: { adapter: { sids, rooms } } } = io;
    const RoomList = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) { 
            RoomList.push({
                roomName: key,
                roomCount: countUsers(key)
            });
        }
    });
    return RoomList;
};

const countUsers = (roomName) => {
    return io.sockets.adapter.rooms.get(roomName)?.size;
};

io.on("connection", socket => {
    socket.onAny((event) => console.log(`Socket ID: ${socket.id}, Event: ${event}`));

    io.sockets.emit("roomlist", publicRooms());

    socket.on("enter_room", (roomName, showRoom) => {
        socket.nickname = `Anonymous (ID: ${socket.id})`;
        socket.join(roomName);
        showRoom(roomName, countUsers(roomName));
        socket.to(roomName).emit("welcome", socket.nickname, countUsers(roomName));
        io.sockets.emit("roomlist", publicRooms());
    });

    socket.on("disconnecting", () => { /* Executed right before the socket lost the connection */
        socket.rooms.forEach((room) => socket.to(room).emit("leave_room", socket.nickname, countUsers(room) - 1));
    });

    socket.on("disconnect", () => { /* Executed after the socket lost the connection */
        io.sockets.emit("roomlist", publicRooms());
    })

    socket.on("message", (message, roomName, self) => {
        socket.to(roomName).emit("message", socket.nickname, message);
        self();
    });

    socket.on("nickname", (nickname, roomName, self) => {
        const prevName = socket.nickname;
        socket.nickname = nickname;
        socket.to(roomName).emit("nickname", prevName, socket.nickname);
        self();
    });
});

/* wss.on("connection", (socket) => { 
    sockets.push(socket);
    socket.name = "Anonymous";
    console.log("Connected to Browser");
    socket.on("close", () => console.log("Disconnected from the Browser"));
    socket.on("message", (message) => {
        const parsed = JSON.parse(message);
        console.log(parsed);
        switch (parsed.type) {
            case "text": 
                sockets.forEach((aSocket) => aSocket.send(`${socket.name}: ${parsed.payload.toString()}`));
                break;
            case "name":
                socket.name = parsed.payload;
                break;
        }
    });
}); */

server.listen(3000, () => {
    console.log(`Listening on https://localhost:3000`);
});

/* Listen on Port 3000 for Connections → Replaced by 'server.listen' to Use WSS */
/* app.listen(3000, () => {
    console.log(`Listening on https://localhost:3000`);
}); */ 
