export function checkPermission(user: User, endpoint: string, subEndpoint = null) {
  if (!user || !user.permisos) return false;
  
  const permiso = Object.values(user.permisos).find(p => p.endpoint === endpoint);
  if (!permiso) return false;
  
  if (!subEndpoint) {
    return permiso.valor > 0;
  }
  
  if (!permiso.sub_permisos) return false;
  const subPermiso = Object.values(permiso.sub_permisos).find(sp => sp.endpoint === subEndpoint);
  return subPermiso ? subPermiso.valor > 0 : false;
}

// Hook personalizado para usar con tu AuthContext
export function usePermissions() {
  // Asumiendo que tienes useAuth disponible
  // const { user } = useAuth();
  
  const hasPermission = (endpoint: string, subEndpoint: string | null = null): boolean => {
    // return checkPermission(user, endpoint, subEndpoint);
    return false; // Placeholder return until you uncomment the actual implementation
  };
  
  return { hasPermission };
}
