const { createApp } = require('./app');
const env = require('./config/env');

const app = createApp();

app.listen(env.port, () => {
  console.log(`✅ Server running on port ${env.port} (${env.nodeEnv})`);
  console.log(`📚 Swagger: http://localhost:${env.port}/api/docs`);
});
