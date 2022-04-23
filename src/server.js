import http from "http";
import express from "express";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

const app = express(); /* Start a Server */

app.set("view engine", "pug"); /* Set View Engine as Pug */
app.set("views", `${__dirname}/views`); /* Set View Directory */
app.use("/public", express.static(`${__dirname}/public`)); /* Set a Static Middleware (First: Virtual Path, Second: → Directory of Static Files (Images, JS, etc.) */
app.get("/", (req, res) => res.render("home")); /* Respond from the Root URL → Render 'home.pug' */
app.get("/*", (req, res) => res.redirect("/")); /* Redirect to '/' for All SubURLs */

const server = http.createServer(app); /* Create HTTP Server (Warning: Name Matters! → Must not be 'Server') */
const io = new Server(server, {cors: { origin: ["https://admin.socket.io"], credentials: true } });
instrument(io, { auth: false });

io.on("connection", (socket) => {
    socket.on("enter_room", (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome");
    });

    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });

    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });

    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    });
});

server.listen(3000, () => {
    console.log(`Listening on https://localhost:3000`);
});