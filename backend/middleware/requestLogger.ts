import logger from '../services/logger.service';

function requestLogger(req, res, next) {
  logger.info(`${req.method} ${req.path}`, {
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
}

export default requestLogger;
module.exports = exports.default;
