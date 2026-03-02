const { validationResult } = require('express-validator');

/**
 * Middleware: validateBody
 * Must be placed AFTER the express-validator check() rules in a route chain.
 * Returns 400 with field errors if any validation fails.
 */
const validateBody = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

module.exports = { validateBody };
