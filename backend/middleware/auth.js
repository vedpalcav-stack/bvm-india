// backend/middleware/auth.js

module.exports = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Please login."
    });
  }

  // JWT verification can be added later
  req.user = {
    id: 1,
    name: "Admin"
  };

  next();
};
