import http from "http";

export const DEFAULT_PORT = 3000;

export const log = (type, message) => {
  console[type](
    `[${new Date().toISOString()}] ${type.toUpperCase()}: ${message}`
  );
};

export const handleRequest = (req, res, targetPort) => {
  const proxy = http.request({ port: targetPort }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  req.pipe(proxy, { end: true });

  proxy.on("error", (err) => {
    res.writeHead(500);
    res.write("Error connecting to target server");
    res.end();
  });
};
