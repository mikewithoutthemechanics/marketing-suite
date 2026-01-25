const Joi = require('joi');

const configSchema = Joi.object({
  PORT: Joi.number().default(4000),
  MASTER_KEY: Joi.string().default('change_this_to_a_strong_secret'),
  OPENROUTER_API_KEY: Joi.string().default(''),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});

module.exports = { configSchema };