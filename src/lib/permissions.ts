// src/lib/permissions.ts
export type Role = 'FRONT_OFFICE' | 'ACCOUNTING' | 'MARKETING' | 'SUPERVISOR' | 'OWNER'

export type Permission = 
  | 'members:read' | 'members:write'
  | 'member_transactions:read' | 'member_transactions:write'
  | 'member_absences:read' | 'member_absences:write'
  | 'company_transactions:read' | 'company_transactions:write'
  | 'campaigns:read' | 'campaigns:write'
  | 'campaign_logs:read' | 'campaign_logs:write'
  | 'analytics:read'
  | 'activity_logs:read'

export const rolePermissions: Record<Role, Permission[]> = {
  FRONT_OFFICE: [
    'members:read', 'members:write',
    'member_transactions:read', 'member_transactions:write',
    'member_absences:read', 'member_absences:write'
  ],
  ACCOUNTING: [
    'company_transactions:read', 'company_transactions:write'
  ],
  MARKETING: [
    'campaigns:read', 'campaigns:write',
    'campaign_logs:read', 'campaign_logs:write'
  ],
  SUPERVISOR: [
    'members:read', 'member_transactions:read', 'member_absences:read',
    'company_transactions:read', 'campaigns:read', 'campaign_logs:read'
  ],
  OWNER: [
    'members:read', 'members:write',
    'member_transactions:read', 'member_transactions:write',
    'member_absences:read', 'member_absences:write',
    'company_transactions:read', 'company_transactions:write',
    'campaigns:read', 'campaigns:write',
    'campaign_logs:read', 'campaign_logs:write',
    'analytics:read', 'activity_logs:read'
  ]
}

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) || false
}

export function canWrite(userRole: Role, resource: string): boolean {
  return hasPermission(userRole, `${resource}:write` as Permission)
}

export function canRead(userRole: Role, resource: string): boolean {
  return hasPermission(userRole, `${resource}:read` as Permission)
}