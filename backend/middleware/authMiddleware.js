// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // Used for ObjectId type check
const User = require('../models/User'); // Import your User model

const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract the token (e.g., "Bearer TOKEN_STRING" -> "TOKEN_STRING")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using your JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the user's ID from the token payload to the request object
      // Assuming your JWT payload has an 'id' field for the user's MongoDB _id
      req.userId = decoded.id; 
      
      // Optional: Fetch the user from the database and attach to request
      // This is good practice if you need more user details in subsequent middleware/routes
      // req.user = await User.findById(decoded.id).select('-password'); // Exclude password

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('JWT verification error:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
  }

  // If no token was found
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };