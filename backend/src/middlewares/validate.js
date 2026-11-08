const AppError = require('../utils/AppError');

// validate(schema) → valida req.body e substitui pelo valor parseado
const validate = (schema, { partial = false } = {}) => (req, _res, next) => {
  const s = partial ? schema.partial() : schema;
  const r = s.safeParse(req.body);
  if (!r.success) return next(new AppError('Dados inválidos', 400, r.error.flatten().fieldErrors));
  req.body = r.data;
  next();
};

module.exports = validate;
