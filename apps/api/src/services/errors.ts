// Errors raised by upstream services. Routes map them to 502 / 504.

export class UpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpstreamError';
  }
}

export class UpstreamTimeoutError extends Error {
  constructor(message = 'Upstream request timed out') {
    super(message);
    this.name = 'UpstreamTimeoutError';
  }
}
