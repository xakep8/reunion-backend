const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Adjust based on your setup

async function verifyToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).send('Token is required for authentication');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).send('Invalid token: User does not exist');
    }

    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).send('Invalid or expired token');
  }
}

module.exports = verifyToken;