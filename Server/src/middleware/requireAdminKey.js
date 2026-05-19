export function requireAdminKey(req, res, next) {
  const configuredAdminKey = process.env.ADMIN_API_KEY;
  const providedAdminKey = req.header('x-admin-key');

  if (!configuredAdminKey) {
    return res.status(500).json({
      message: 'Admin API key is not configured on the server.',
    });
  }

  if (!providedAdminKey || providedAdminKey !== configuredAdminKey) {
    return res.status(401).json({
      message: 'Unauthorized.',
    });
  }

  next();
}