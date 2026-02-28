const swaggerJSDoc = require('swagger-jsdoc');
const env = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HRMS RBAC Demo API',
      version: '1.0.0',
      description: 'HRMS RBAC Demo',
    },
    servers: [{ url: env.swaggerBaseUrl }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.js'],
};

module.exports = swaggerJSDoc(options);
