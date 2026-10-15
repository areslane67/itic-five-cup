export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

// Express 4 n'attrape pas les erreurs des handlers async : on les transmet à next()
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
