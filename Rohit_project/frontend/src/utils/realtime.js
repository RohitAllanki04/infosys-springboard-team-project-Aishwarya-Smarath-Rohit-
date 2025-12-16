// Lightweight Realtime client with reconnect/backoff and simple event handling
class RealtimeClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options || {};
    this.ws = null;
    this.ready = false;
    this._listeners = new Map(); // event -> Set(handler)
    this._shouldReconnect = !!this.options.reconnect;
    this._reconnectAttempts = 0;
    this._maxReconnectAttempts = this.options.maxReconnectAttempts || 10;
    this._backoffBase = this.options.backoffBase || 500; // ms
    this._backoffMax = this.options.backoffMax || 30000; // ms
    this._timeout = null;
    this.parseMessage = this.options.parseMessage || (msg => {
      try { return JSON.parse(msg); } catch (e) { return msg; }
    });
  }

  _emit(event, data) {
    const set = this._listeners.get(event);
    if (set) for (const fn of Array.from(set)) try { fn(data); } catch(e){}
  }

  on(event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const set = this._listeners.get(event);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) this._listeners.delete(event);
  }

  connect() {
    if (this.ws) return;
    const url = typeof this.url === 'function' ? this.url() : this.url;
    try {
      this.ws = new WebSocket(url, this.options.protocols || []);
    } catch (e) {
      this._handleClose();
      return;
    }

    this.ws.onopen = (ev) => {
      this.ready = true;
      this._reconnectAttempts = 0;
      this._emit('open', ev);
    };

    this.ws.onclose = (ev) => {
      this.ready = false;
      this.ws = null;
      this._emit('close', ev);
      if (this._shouldReconnect) this._scheduleReconnect();
    };

    this.ws.onerror = (ev) => {
      this._emit('error', ev);
    };

    this.ws.onmessage = (ev) => {
      const raw = ev.data;
      const parsed = this.parseMessage(raw);
      // messages can be { type, payload } or other shapes
      if (parsed && typeof parsed === 'object' && parsed.type) {
        this._emit(parsed.type, parsed.payload);
        this._emit('message', parsed);
      } else {
        this._emit('message', parsed);
      }
    };
  }

  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    try {
      const out = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(out);
      return true;
    } catch (e) {
      return false;
    }
  }

  close() {
    this._shouldReconnect = false;
    if (this._timeout) clearTimeout(this._timeout);
    if (this.ws) {
      try { this.ws.close(); } catch(e){}
      this.ws = null;
    }
  }

  _scheduleReconnect() {
    if (!this._shouldReconnect) return;
    if (this._reconnectAttempts >= this._maxReconnectAttempts) return;
    const attempt = ++this._reconnectAttempts;
    const backoff = Math.min(this._backoffMax, Math.round(this._backoffBase * Math.pow(1.8, attempt)));
    const jitter = Math.floor(Math.random() * 300);
    const delay = backoff + jitter;
    this._timeout = setTimeout(() => {
      this._timeout = null;
      this.connect();
    }, delay);
  }
}

export function createRealtimeClient(urlOrFactory, opts = {}) {
  return new RealtimeClient(urlOrFactory, opts);
}

export default RealtimeClient;
