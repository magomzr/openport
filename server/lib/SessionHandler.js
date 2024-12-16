export class SessionHandler {
  constructor(options) {
    this.options = options;
    this.sessions = new Map();
    this.stats = {
      tunnels: 0,
    };
  }

  createSession() {
    const sessionId = Math.random().toString(36).substring(2);
    this.sessions[sessionId] = {};
    return sessionId;
  }

  getSession(sessionId) {
    return this.sessions[sessionId];
  }

  setSession(sessionId, session) {
    this.sessions[sessionId] = session;
  }

  deleteSession(sessionId) {
    delete this.sessions[sessionId];
  }
}
