#!/usr/bin/env node

/**
 * Module dependencies.
 */

import app from "../app.js";
import { createServer } from "http";
import { createClient } from "redis";
import mongoose from "mongoose";
import debugMode from "debug";
const debug = debugMode("yaan:server");
import { Server as socketServer } from "socket.io";
import { ServerToClientEvents } from "../utils/types.js";

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */

const server = createServer(app);
const io = new socketServer<ServerToClientEvents>(server);

/**
 * Create Redis server.
 */

const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST_URL,
    port: Number(process.env.REDIS_PORT),
  },
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
redisClient.on("error", (err) => console.log("Redis Client Error", err));
server.on("listening", onListening);
io.on("connection", () => {
  console.log("Screen has connected");
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: { syscall: string; code: unknown }) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr?.port;
  debug("Listening on " + bind);
  redisClient
    .connect()
    .then(() => console.log("redisClient is running."))
    .catch((err) => console.log(err));
  mongoose
    .connect(process.env.MONGODB_CONNECTION_STRING!)
    .then(() => console.log("mongoose is running."))
    .catch((err) => console.log(err));
}

export { redisClient, io };
