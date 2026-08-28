const { AppError } = require('../errors/AppError');

const validateRequest = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    req.body = parsed.body;
    req.query = parsed.query;
    req.params = parsed.params;
    next();
  } catch (err) {
    const errorMessage = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    next(new AppError(`Validation Error: ${errorMessage}`, 400));
  }
};

module.exports = { validateRequest };
