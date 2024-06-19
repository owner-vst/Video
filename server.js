require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
const http = require("http");
const https = require("https");
const { Server } = require("socket.io");

const isProduction = process.env.NODE_ENV === "production";
let server;

if (isProduction) {
  server = http.createServer(app); // Render provides HTTPS automatically
} else {
  server = https.createServer(
    {
      key: fs.readFileSync(path.join(__dirname, "server.key")),
      cert: fs.readFileSync(path.join(__dirname, "server.cert")),
    },
    app
  );
}

const io = new Server(server);

let onlineUsers = [];

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  onlineUsers.push(socket.id);
  io.emit("update-user-list", onlineUsers);

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    onlineUsers = onlineUsers.filter((id) => id !== socket.id);
    io.emit("update-user-list", onlineUsers);
  });

  socket.on("request-call", (toId) => {
    io.to(toId).emit("request-call", socket.id);
  });

  socket.on("accept-call", (toId) => {
    io.to(toId).emit("accept-call", socket.id);
  });

  socket.on("reject-call", (toId) => {
    io.to(toId).emit("reject-call", socket.id);
  });

  socket.on("webrtc-offer", (toId, offer) => {
    io.to(toId).emit("webrtc-offer", socket.id, offer);
  });

  socket.on("webrtc-answer", (toId, answer) => {
    io.to(toId).emit("webrtc-answer", socket.id, answer);
  });

  socket.on("webrtc-ice-candidate", (toId, candidate) => {
    io.to(toId).emit("webrtc-ice-candidate", socket.id, candidate);
  });
});

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(
    `Server is running on ${
      isProduction ? "http" : "https"
    }://localhost:${PORT}`
  );
});
