import http from "http";
import net from "net";

const log = (type, message) => {
  console[type](
    `[${new Date().toISOString()}] ${type.toUpperCase()}: ${message}`
  );
};

const startClient = (host, localPort, callback = () => {}) => {
  try {
    const createReqOpts = {
      hostname: host,
      port: 3000,
      path: "/api/create",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(createReqOpts, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const { id, port } = JSON.parse(data);
          log("info", `Tunnel created with id: ${id} on port: ${port}`);

          // Connecting to remote tunnel server
          const remote = net.connect(port, host, () => {
            log("info", "Connected to remote tunnel server");
            remote.setKeepAlive(true);

            // Connecting to local port
            const local = net.connect(localPort, "localhost", () => {
              log("info", "Connected to local server");
              // Pipe data between local server and remote tunnel
              local.pipe(remote).pipe(local);
            });

            local.on("error", (err) => {
              log("error", `Error connecting to local port: ${err.message}`);
              remote.end();
            });
          });

          remote.on("error", (err) => {
            log("error", `Error connecting to remote server: ${err.message}`);
          });

          remote.on("close", () => {
            log("info", "Remote connection closed");
          });
        } catch (parseError) {
          log("error", `Error parsing server response: ${parseError.message}`);
        }
      });
    });

    req.on("error", (err) => {
      log("error", `Error creating tunnel: ${err.message}`);
    });

    req.write(JSON.stringify({ localPort }));
    req.end();
    callback();
  } catch (error) {
    callback(error);
  }
};

startClient("localhost", 5173, (err) => {
  if (err) {
    log("error", `Error starting client: ${err.message}`);
    return;
  }

  log("info", "Client started");
});
