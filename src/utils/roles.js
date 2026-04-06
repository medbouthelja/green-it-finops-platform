export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  TECH_LEAD: 'TECH_LEAD',
};

/**
 * Trois rôles métier (+ ADMIN) :
 * - ADMIN : tout
 * - MANAGER : vision globale, budget, FinOps, simulation, CRUD projets & équipe
 * - TECH_LEAD : dashboard, projets (lecture), suivi technique, FinOps, temps — pas budget global ni simulation ni CRUD projet
 */
export const ACCESS = {
  DASHBOARD: [ROLES.MANAGER, ROLES.TECH_LEAD],
  BUDGET_PAGE: [ROLES.MANAGER],
  FINOPS_PAGE: [ROLES.MANAGER, ROLES.TECH_LEAD],
  SIMULATION_PAGE: [ROLES.MANAGER],
  PROJECT_CRUD: [ROLES.MANAGER],
  PROJECT_TEAM: [ROLES.MANAGER],
  PROJECT_BUDGET_DETAIL: [ROLES.MANAGER],
  PROJECT_PROGRESS_TAB: [ROLES.MANAGER, ROLES.TECH_LEAD],
};

export const hasRole = (user, role) => {
  return user?.role === role;
};

export const hasAnyRole = (user, roles) => {
  return roles.includes(user?.role);
};

/** Route ou action : admin a toujours accès. */
export const canAccess = (user, requiredRoles) => {
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;
  return requiredRoles.includes(user.role);
};

export const getHomePath = () => '/dashboard';

export const canManageProjectsCrud = (user) => canAccess(user, ACCESS.PROJECT_CRUD);

export const canManageProjectTeam = (user) => canAccess(user, ACCESS.PROJECT_TEAM);

export const canViewBudgetInProject = (user) => canAccess(user, ACCESS.PROJECT_BUDGET_DETAIL);

export const canViewProgressTab = (user) => canAccess(user, ACCESS.PROJECT_PROGRESS_TAB);
