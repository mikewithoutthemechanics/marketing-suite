const { hashPassword, comparePassword, generateToken, findUserByEmail, createUser } = require('./auth.service');
const logger = require('../../logging/logger');
process.env.SERVICE_NAME = 'auth-service';

module.exports = {
  // Register a new user
  register: async ({ body }) => {
    const { email, password } = body;
    logger.info('Registration attempt', { email });
    if (!email || !password) {
      logger.warn('Registration failed - missing credentials');
      return { status: 400, body: { error: 'Email and password required' } };
    }
    try {
      const hashedPassword = await hashPassword(password);
      const user = await createUser({ email, password: hashedPassword });
      if (!user) {
        logger.error('User creation failed', { email });
        return { status: 400, body: { error: 'Failed to create user' } };
      }
      const token = generateToken({ userId: user.id, email });
      logger.info('User registered successfully', { userId: user.id, email });
      return { token };
    } catch (error) {
      logger.error('Registration error', { email, error: error.message });
      throw error;
    }
  },

  // Login an existing user
  login: async ({ body }) => {
    const { email, password } = body;
    logger.info('Login attempt', { email });
    if (!email || !password) {
      logger.warn('Login failed - missing credentials');
      return { status: 400, body: { error: 'Email and password required' } };
    }
    try {
      const user = await findUserByEmail(email);
      if (!user) {
        logger.warn('Login failed - user not found', { email });
        return { status: 401, body: { error: 'Invalid credentials' } };
      }
      const passwordMatches = await comparePassword(password, user.password);
      if (!passwordMatches) {
        logger.warn('Login failed - invalid password', { email, userId: user.id });
        return { status: 401, body: { error: 'Invalid credentials' } };
      }
      const token = generateToken({ userId: user.id, email });
      logger.info('User logged in successfully', { userId: user.id, email });
      return { token };
    } catch (error) {
      logger.error('Login error', { email, error: error.message });
      throw error;
    }
  },

  // Get current user info (protected route)
  getMe: async ({ token }) => {
    logger.debug('Get current user request');
    try {
      const payload = require('./auth.service').verifyToken(token);
      if (!payload) {
        logger.warn('Invalid token in getMe request');
        return { status: 401, body: { error: 'Invalid token' } };
      }
      logger.info('User info retrieved', { userId: payload.userId, email: payload.email });
      return { user: payload };
    } catch (error) {
      logger.error('Get current user error', { error: error.message });
      throw error;
    }
  }
};