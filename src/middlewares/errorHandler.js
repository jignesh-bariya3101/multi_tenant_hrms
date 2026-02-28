const { HttpError } = require('../utils/httpError');
const { logAuditForError } = require('./auditLogger');

async function errorHandler(err, req, res, next) {
  const status = err instanceof HttpError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  const payload = {
    success: false,
    message,
  };

  if (err instanceof HttpError && err.details) payload.details = err.details;
  if (process.env.NODE_ENV !== 'production' && !(err instanceof HttpError)) {
    payload.stack = err.stack;
  }

  await logAuditForError(req, status);

  res.status(status).json(payload);
}

module.exports = { errorHandler };
