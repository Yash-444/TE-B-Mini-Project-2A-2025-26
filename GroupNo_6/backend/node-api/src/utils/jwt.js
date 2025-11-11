const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  return jwt.sign(
    { 
      userId: payload.userId,
      email: payload.email
    },
    process.env.JWT_SECRET || 'd61e313a43bce24eeba16efa2dd70d2330100e8c92b2fd8910de18db68681bf5c397f8bcc5eff1c2a47489b3557e24c06dba0fe671c28e51fed73b170c404588',
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(
      token, 
      process.env.JWT_SECRET || 'd61e313a43bce24eeba16efa2dd70d2330100e8c92b2fd8910de18db68681bf5c397f8bcc5eff1c2a47489b3557e24c06dba0fe671c28e51fed73b170c404588'
    );
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};