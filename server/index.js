const express = require("express");
const connectDB = require("./db.js");
const cors = require("cors");
const http = require("http");
const PORT = 5500;
const { initSocket } = require("./socket/index.js");
const { startStaleOnlineUsersJob } = require("./jobs/staleOnlineUsers.js");
const { CORS_ORIGIN, FRONTEND_URL } = require("./secrets.js");
const app = express();
connectDB(); // connect first

const isAllowedOrigin = (origin) =>
  !origin ||
  CORS_ORIGIN === "*" ||
  origin === CORS_ORIGIN ||
  origin === FRONTEND_URL;

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));

// Routes
app.get("/", (req, res) => {
  res.send("Hello World");
});
app.use("/auth", require("./Routes/auth-routes.js"));
app.use("/user", require("./Routes/user-routes.js"));
app.use("/message", require("./Routes/message-routes.js"));
app.use("/conversation", require("./Routes/conversation-routes.js"));

// Server setup
const server = http.createServer(app);

// Socket.io setup
initSocket(server); // Initialize socket.io logic

// Start server and connect to database
const start = async () => {
  server.listen(PORT, () => {
    console.log(`🚀 Server started at http://localhost:${PORT}`);
  });
  // Start background jobs after DB is ready
  startStaleOnlineUsersJob();
};

start();
module.exports = app;
