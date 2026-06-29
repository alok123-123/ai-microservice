/**
 * Attach a unique request ID to every incoming request.
 *
 * The ID is available on `req.requestId` and is also sent back in the
 * `X-Request-Id` response header so clients can quote it in bug reports.
 */

const crypto = require('crypto');

function requestId(req, _res, next) {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  _res.setHeader('X-Request-Id', req.requestId);
  next();
}

module.exports = requestId;
