import http from "http";
import net from "net";

const log = (type, message) => {
  console[type](`[${new Date().toISOString()}] ${type.toUpperCase()}: ${message}`);
};

const startClient = (host, localPort, callback = () => {}) => {
  try {
    const createReqOpts = {
      hostname: host,
      port: 3000,
      path: "/api/create",
      method: "POST",
    };

    const req = http.request(createReqOpts, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        console.log("chunk", chunk);
        data += chunk;
      });
      res.on("end", () => {
        const { id, port } = JSON.parse(data);
        log("info", `Tunnel created with id: ${id} on port: ${port}`);

        // Connecting to remote server
        const remote = net.connect(port, host, () => {
          log("info", "Connected to remote server");
          remote.setKeepAlive(true);

          // Connecting to local port
          const local = net.connect(localPort, "localhost", () => {
            log("info", "Connected to local port");

            local.pipe(remote).pipe(local);
          });

          local.on("error", (err) => {
            log("error", "Error connecting to local port");
            remote.end();
          });
        });

        remote.on("error", (err) => {
          console.error("Error connecting to remote server", err);
        });
      });
    });

    req.on("error", (err) => {
      console.error("Error creating tunnel", err);
    });

    req.end();
    callback();
  } catch (error) {
    callback(error);
  }
};

startClient("localhost", 3000, (err) => {
  if (err) {
    console.error("Error starting client", err);
    return;
  }

  console.log("Client started");
});
