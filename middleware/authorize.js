function matchesPermission(granted, required) {
  if (granted === '*') return true;
  if (granted === required) return true;

  const [gDomain, gAction] = String(granted).split(':');
  const [rDomain, rAction] = String(required).split(':');
  if (!gDomain || !gAction || !rDomain || !rAction) return false;

  const domainMatches = gDomain === '*' || gDomain === rDomain;
  const actionMatches = gAction === '*' || gAction === rAction;
  return domainMatches && actionMatches;
}

const rolePermissions = {
  owner: ['*'],
  admin: [
    'users:manage',
    'invitations:manage',
    'roles:manage',
    'appointments:*',
    'patients:*',
    'doctors:*',
    'departments:*',
    'rooms:*',
    'room_reservations:*',
    'prescriptions:*',
    'medical_files:*',
    'reports:*',
    'hospital_files:*',
    'notifications:read',
    'notifications:write',
    'triage:*',
    'cases:*',
    'locations:*',
    'contact:*',
    'dashboard:read',
    'staff_schedule:*',
    'ambulances:*',
  ],
  doctor: [
    'appointments:read',
    'appointments:write',
    'patients:read',
    'prescriptions:read',
    'prescriptions:write',
    'medical_files:read',
    'medical_files:write',
    'reports:read',
    'hospital_files:read',
    'notifications:read',
    'doctors:read',
    'departments:read',
    'contact:write',
    'dashboard:read',
    'staff_schedule:read',
    'ambulances:read',
  ],
  nurse: [
    'patients:read',
    'triage:*',
    'cases:*',
    'rooms:read',
    'rooms:write',
    'room_reservations:*',
    'notifications:read',
    'appointments:read',
    'doctors:read',
    'departments:read',
    'contact:write',
    'dashboard:read',
    'staff_schedule:read',
    'ambulances:*',
  ],
  pending: [],
};

function hasPermission(user, permission) {
  if (!user?.role) return false;
  const granted = rolePermissions[user.role] || [];
  return granted.some((value) => matchesPermission(value, permission));
}

function requirePermission(permission) {
  return function requirePermissionMiddleware(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    next();
  };
}

function requireRole(...roles) {
  const allowed = new Set(roles.flat().filter(Boolean));
  return function requireRoleMiddleware(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    if (!allowed.has(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    next();
  };
}

module.exports = {
  hasPermission,
  requirePermission,
  requireRole,
};
