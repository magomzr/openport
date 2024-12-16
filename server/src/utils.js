export const DEFAULT_PORT = 3000;

export const log = (type, message) => {
  console[type](`[${new Date().toISOString()}] ${type.toUpperCase()}: ${message}`);
};
