import express, { json } from "express";
import { v4 as uuidv4, validate } from "uuid";
import http from "http";
import net from "net";

const log = (type, message) => {
  console[type](
    `[${new Date().toISOString()}] ${type.toUpperCase()}: ${message}`
  );
};

const handleRequest = (req, res, targetPort) => {
  const proxy = http.request({ port: targetPort }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  req.pipe(proxy, { end: true });

  proxy.on("error", (err) => {
    log("error", `Error connecting to target server: ${err.message}`);
    res.writeHead(500);
    res.write("Error connecting to target server");
    res.end();
  });
};

const startServer = (port, callback = () => {}) => {
  try {
    const DEFAULT_PORT = 3000;
    const app = express();
    const server = http.createServer();
    const clients = new Map();
    app.use(json());

    app.get("/", (_, res) => {
      res.send(
        "OpenPort: Self-hosted tunneling server with simple, flexible connections."
      );
    });

    app.get("/api/status", (_, res) => {
      res.json({
        status: "ok",
        clients: clients.size,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      });
    });

    app.post("/api/create", (_, res) => {
      const id = uuidv4();
      const newServer = net.createServer((clientSocket) => {
        log("info", `Client connected to tunnel id: ${id}`);

        // Connect to the target server (e.g., Express app on port 5173)
        const targetSocket = net.connect(5173, "localhost", () => {
          log("info", `Connected to target server for tunnel id: ${id}`);

          // Pipe data between client and target server
          clientSocket.pipe(targetSocket);
          targetSocket.pipe(clientSocket);
        });

        // Handle errors on target socket
        targetSocket.on("error", (err) => {
          log(
            "error",
            `Target socket error on tunnel id: ${id} - ${err.message}`
          );
          clientSocket.end();
        });

        // Handle client socket errors
        clientSocket.on("error", (err) => {
          log(
            "error",
            `Client socket error on tunnel id: ${id} - ${err.message}`
          );
          targetSocket.end();
        });

        // Handle client socket end
        clientSocket.on("end", () => {
          log("info", `Client disconnected from tunnel id: ${id}`);
          targetSocket.end();
        });

        // Handle target socket end
        targetSocket.on("end", () => {
          log("info", `Target server disconnected for tunnel id: ${id}`);
          clientSocket.end();
        });
      });

      newServer.listen(() => {
        const { port } = newServer.address();
        log("info", `Created new server with id: ${id} on port: ${port}`);
        clients.set(id, { createdAt: Date.now(), port, server: newServer });
        res.json({ status: "ok", id, port });
      });

      newServer.on("error", (err) => {
        log("error", `Error on tunnel server id: ${id} - ${err.message}`);
        res.status(500).json({ status: "error", message: err.message });
      });
    });

    app.get("/api/tunnels", (_, res) => {
      res.json([...clients]);
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
        const targetPort = parseInt(req.headers["op-target-port"], 10);

        let message;
        if (
          clients.has(targetId) &&
          clients.get(targetId).port === targetPort
        ) {
          message = `Tunneling request to existing client`;
          log("info", message);
          handleRequest(req, res, targetPort);
        } else {
          message = "Invalid tunneling request, target client does not exist";
          log("error", message);
          res.writeHead(404);
          res.write(message);
          res.end();
        }
      } else {
        app(req, res);
      }
    });

    server.listen(port || DEFAULT_PORT, () => {
      log("info", `Server started on port ${port || DEFAULT_PORT}`);
      callback();
    });
  } catch (error) {
    callback(error);
  }
};

startServer(3000, (err) => {
  if (err) {
    console.error("Error starting server", err);
    return;
  }
  log("info", "Waiting for incoming connections...");
});
