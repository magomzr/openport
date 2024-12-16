export class OpenPortError extends Error {
  constructor(type, message = "") {
    super(type + (message ? ": " + message : ""));
  }
}
