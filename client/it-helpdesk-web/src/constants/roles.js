export const AppRoles = {
  Admin: 'Admin',
  Agent: 'IT Support Agent',
  Employee: 'Employee',
  Manager: 'Manager',
};

export function canCreateTickets(hasRole) {
  return hasRole(AppRoles.Admin) || hasRole(AppRoles.Employee);
}
