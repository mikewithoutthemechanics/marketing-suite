module.exports = (app) => {
  const { authenticate } = require('./middleware');
  const { register, login, getMe } = require('./auth.controller');

  app.post('/auth/register', register);
  app.post('/auth/login', login);
  app.get('/auth/me', authenticate, getMe);
};