import OpenPort from "./OpenPort.js";
import { OpenPortError } from "./error.js";

export function createTunnel(port, callback) {
  if (!port) {
    const err = new OpenPortError("Missing argument", "port is required");
    if (callback) return callback(err);
    throw err;
  }

  if (!/^\d+$/.test(port)) {
    const err = new OpenPortError("Invalid argument", "port must be a number");
    if (callback) return callback(err);
    throw err;
  }

  const intPort = parseInt(port, 10);

  if (intPort < 0 || intPort > 65535) {
    const err = new OpenPortError(
      "Invalid argument",
      "port must be a valid number between 0 and 65535"
    );
    if (callback) return callback(err);
    throw err;
  }

  const openPort = new OpenPort({ port: intPort });
  openPort.emit("start");

  if (callback) return callback(null, openPort);
  return new Promise((resolve, reject) => {
    resolve(openPort);
  });
}

const [args] = process.argv.slice(2);
createTunnel(args, (err, tunnel) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Tunnel is now open on port ${tunnel.port}`);
});
