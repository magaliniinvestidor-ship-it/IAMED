'use client';

import { useMemo } from 'react';

export const PERMISSIONS = {
  view: {
    reception: 'view_reception',
    agenda: 'view_agenda',
    hce: 'view_hce',
    diagnostic: 'view_diagnostic',
    finance: 'view_finance',
    stock: 'view_stock',
    med_work: 'view_med_work',
    crm: 'view_crm',
    security: 'view_security',
    insurance: 'view_insurance',
    fee_schedule: 'view_fee_schedule',
    copay: 'view_copay',
    batches: 'view_batches',
    eligibility: 'view_eligibility',
    settlements: 'view_settlements',
    foreign_billing: 'view_foreign_billing',
    bi: 'view_bi',
    patient_portal: 'view_patient_portal',
    hospitalization: 'view_hospitalization',
  },
  perform: {
    admit: 'perform_admit',
    prescribe: 'perform_prescribe',
    sifen: 'perform_sifen',
    post_finance: 'perform_post_finance',
    stock: 'perform_stock',
    beds: 'perform_beds',
    rbac: 'perform_rbac',
    insurance: 'perform_insurance',
    fee_schedule: 'perform_fee_schedule',
    copay: 'perform_copay',
    batches: 'perform_batches',
    eligibility: 'perform_eligibility',
    settlements: 'perform_settlements',
    foreign_billing: 'perform_foreign_billing',
    surgery: 'perform_surgery',
    aso: 'perform_aso',
  }
} as const;

// Maps wildcard categories (e.g. "clinical:*") to specific permissions
const WILDCARD_MAP: Record<string, string[]> = {
  admin: [
    'view_reception', 'view_agenda', 'view_hce', 'view_diagnostic', 'view_finance',
    'view_stock', 'view_med_work', 'view_crm', 'view_security', 'view_insurance',
    'view_fee_schedule', 'view_copay', 'view_batches', 'view_eligibility',
    'view_settlements', 'view_foreign_billing', 'view_bi', 'view_patient_portal',
    'view_hospitalization',
    'perform_admit', 'perform_prescribe', 'perform_sifen', 'perform_post_finance',
    'perform_stock', 'perform_beds', 'perform_rbac', 'perform_insurance',
    'perform_fee_schedule', 'perform_copay', 'perform_batches', 'perform_eligibility',
    'perform_settlements', 'perform_foreign_billing', 'perform_surgery', 'perform_aso',
  ],
  clinical: [
    'view_hce', 'view_diagnostic', 'view_med_work', 'view_reception', 'view_agenda',
    'perform_prescribe', 'perform_admit', 'perform_surgery', 'perform_aso',
  ],
  billing: [
    'view_finance', 'view_insurance', 'view_fee_schedule', 'view_copay', 'view_batches',
    'view_eligibility', 'view_settlements', 'view_foreign_billing',
    'perform_sifen', 'perform_post_finance', 'perform_insurance', 'perform_fee_schedule',
    'perform_copay', 'perform_batches', 'perform_eligibility', 'perform_settlements',
    'perform_foreign_billing',
  ],
  pharmacy: [
    'view_stock', 'perform_stock',
  ],
  hr: [
    'view_med_work', 'perform_aso',
  ],
  reports: [
    'view_bi', 'view_crm', 'view_finance', 'view_security',
  ],
  settings: [
    'view_security', 'perform_rbac',
  ],
};

function matchesWildcard(permission: string, userPermissions: string[]): boolean {
  // Direct match
  if (userPermissions.includes(permission)) return true;

  // Check wildcard patterns
  for (const perm of userPermissions) {
    if (!perm.endsWith(':*')) continue;
    const category = perm.slice(0, -2); // remove ":*"
    const allowed = WILDCARD_MAP[category];
    if (allowed && allowed.includes(permission)) return true;
  }

  return false;
}

export type ViewPermission = keyof typeof PERMISSIONS.view;
export type PerformPermission = keyof typeof PERMISSIONS.perform;

export function usePermissions(userPermissions: string[] = []) {
  const canView = useMemo(() => {
    return (key: ViewPermission) => matchesWildcard(PERMISSIONS.view[key], userPermissions);
  }, [userPermissions]);

  const canPerform = useMemo(() => {
    return (key: PerformPermission) => matchesWildcard(PERMISSIONS.perform[key], userPermissions);
  }, [userPermissions]);

  const hasAny = useMemo(() => {
    return (keys: (ViewPermission | PerformPermission)[]) =>
      keys.some(k => matchesWildcard(
        (PERMISSIONS.view as any)[k] || (PERMISSIONS.perform as any)[k],
        userPermissions
      ));
  }, [userPermissions]);

  return { canView, canPerform, hasAny };
}

export function hasPermission(userPermissions: string[] = [], permission: string): boolean {
  return matchesWildcard(permission, userPermissions);
}
