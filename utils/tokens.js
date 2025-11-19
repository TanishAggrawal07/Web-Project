const jwt = require('jsonwebtoken');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: '7d'
  });

module.exports = { signToken };
