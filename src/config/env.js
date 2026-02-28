const dotenv = require('dotenv');

dotenv.config();

function requireEnv(key) {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  swaggerBaseUrl: process.env.SWAGGER_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
};
