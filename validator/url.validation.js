const { param, body, query, check } = require('express-validator');
const { validator } = require('./validator');

const cekemailvalid = [
    body('email').isEmail().notEmpty(),
    validator
]

module.exports = {cekemailvalid}