const { z } = require('zod');

module.exports = (schema, opts = {}) => {
  const partial = Boolean(opts && opts.partial);
  const s = partial && typeof schema?.partial === 'function' ? schema.partial() : schema;

  return (req, res, next) => {
    const result = s.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: result.error.errors });
    }

    // Attach validated data for downstream handlers if useful
    req.validatedBody = result.data;
    next();
  };
};
