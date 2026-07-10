'use client';

import React, { ReactNode, createContext, useContext } from 'react';
import { Lock, AlertTriangle, UserX } from 'lucide-react';
import { usePermissions } from '@/lib/usePermissions';

export function AccessDenied({ 
  message = 'Você não tem permissão para acessar esta área.',
  permission 
}: { message?: string; permission?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-xl text-center">
      <UserX className="w-10 h-10 text-slate-300 mb-3" />
      <p className="font-semibold text-slate-700">Acesso Restrito</p>
      <p className="text-xs text-slate-500 mt-1 max-w-xs">
        {message}
        {permission && <br />}
        {permission && <code className="bg-slate-100 px-1 rounded text-[10px]">{permission}</code>}
      </p>
    </div>
  );
}

interface PermissionGateProps {
  children: ReactNode;
  view?: keyof typeof import('@/lib/usePermissions').PERMISSIONS.view;
  perform?: keyof typeof import('@/lib/usePermissions').PERMISSIONS.perform;
  fallback?: ReactNode;
  userPermissions?: string[];
}

export function PermissionGate({
  children,
  view,
  perform,
  fallback,
  userPermissions = []
}: PermissionGateProps) {
  const { canView, canPerform } = usePermissions(userPermissions);

  if (view && !canView(view)) {
    return fallback || <AccessDenied permission={view} />;
  }

  if (perform && !canPerform(perform)) {
    return fallback || <AccessDenied permission={perform} message="Você não tem permissão para realizar esta ação." />;
  }

  return <>{children}</>;
}

const PermissionsContext = createContext<string[]>([]);

interface WithPermissionsProps {
  children: ReactNode;
  userPermissions: string[];
}

export function WithPermissions({ children, userPermissions }: WithPermissionsProps) {
  return (
    <PermissionsContext.Provider value={userPermissions}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function useUserPermissions() {
  return useContext(PermissionsContext);
}