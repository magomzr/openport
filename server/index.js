import express, { json } from "express";
import { v4 as uuidv4 } from "uuid";

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(json());

// Simple route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Route to return server status
app.get("/api/status", (req, res) => {
  res.json({ status: "OK", mem: process.memoryUsage() });
});

app.post("/api/create", (_, res) => {
  const id = uuidv4();
  console.log(`Created new entity with id: ${id}`);
  res.json({ status: "OK", id });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
