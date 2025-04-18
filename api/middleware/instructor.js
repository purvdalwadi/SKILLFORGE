const instructor = (req, res, next) => {
  if (req.user && req.user.role === 'instructor') {
    // User is an instructor, proceed to the route handler
    next();
  } else {
    // User is not an instructor, deny access
    return res.status(403).json({ message: 'Access denied. Instructor role required.' });
  }
};

module.exports = instructor; 