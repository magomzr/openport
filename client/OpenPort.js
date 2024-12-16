import { EventEmitter } from "events";

export default class OpenPort extends EventEmitter {
  port = null;
  constructor(props = {}) {
    super();
    this.port = props.port;

    this.on("start", () => {});
  }
}
