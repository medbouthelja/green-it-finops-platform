export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  TECH_LEAD: 'TECH_LEAD',
  CONSULTANT: 'CONSULTANT',
};

export const hasRole = (user, role) => {
  return user?.role === role;
};

export const hasAnyRole = (user, roles) => {
  return roles.includes(user?.role);
};

export const canAccess = (user, requiredRoles) => {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  return requiredRoles.includes(user.role);
};

