import express, { json } from "express";
import { v4 as uuidv4, validate } from "uuid";
import http from "http";
import net from "net";
import { DEFAULT_PORT, log } from "./src/utils.js";

const startServer = (port, callback = () => {}) => {
  try {
    const app = express();
    const server = http.createServer();
    const clients = new Map();
    app.use(json());

    app.get("/", (req, res) => {
      res.send("Self-hosted tunneling server with simple, flexible connections.");
    });

    app.get("/api/status", (req, res) => {
      res.json({ status: "ok", clients: clients.size, mem: process.memoryUsage() });
    });

    app.post("/api/create", (_, res) => {
      const id = uuidv4();
      const newServer = net.createServer();
      newServer.listen(() => {
        const { port } = newServer.address();
        log("info", `Created new server with id: ${id} on port: ${port}`);
        clients.set(id, { createdAt: Date.now(), port });
        res.json({ status: "ok", id, port });
      });
    });

    server.on("request", (req, res) => {
      log("info", `Request received: ${req.url}`);
      if (req.headers["op-type"] === "tunnel") {
        if (!req.headers["op-target-id"] || !req.headers["op-target-port"]) {
          log("error", "Invalid tunneling request, missing required headers");
          res.setHeader("Content-Type", "application/json");
          res.writeHead(400);
          res.write(JSON.stringify({ error: "Missing required headers" }));
          res.end();
          return;
        }

        if (!validate(req.headers["op-target-id"])) {
          log("error", "Invalid tunneling request, invalid target id");
          res.setHeader("Content-Type", "application/json");
          res.writeHead(400);
          res.write(JSON.stringify({ error: "Invalid target id" }));
          res.end();
          return;
        }

        const targetId = req.headers["op-target-id"];
        const targetPort = req.headers["op-target-port"];

        let message;
        if (clients.has(targetId)) {
          message = `Tunneling request to existing client`;
          // TODO: Implement tunneling logic to send request to target client
          log("info", message);
        } else {
          message = "Invalid tunneling request, target client does not exist";
          log("error", message);
        }

        res.writeHead(200);
        res.write(message);
        res.end();
      } else {
        app(req, res);
      }
    });

    server.listen(port || DEFAULT_PORT);

    callback();
  } catch (error) {
    callback(error);
  }
};

startServer(3000, (err) => {
  if (err) {
    console.error("Error starting server", err);
    return;
  }
  log("info", "Server started on port 3000");
});
