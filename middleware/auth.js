const jwt = require('jsonwebtoken');

const auth = (role) => (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token =
      header.startsWith('Bearer ') && header.split(' ')[1]
        ? header.split(' ')[1]
        : req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev_secret'
    );

    if (role && payload.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth;
