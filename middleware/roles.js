function checkRole(requiredRole) {
  return function (req, res, next) {
    if (
      req.isAuthenticated() &&
      req.user.role &&
      req.user.role.toLowerCase() === requiredRole.toLowerCase()
    ) {
      return next();
    }
    return res.status(403).send('Access denied');
  };
}

module.exports = { checkRole };