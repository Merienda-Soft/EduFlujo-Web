import { useUser } from '@auth0/nextjs-auth0/client';

export const useUserRoles = () => {
  const { user } = useUser();
  
  const roles: string[] = user?.['https://eduflujo.com/roles'] as string[] || 
                          (user?.app_metadata as { roles?: string[] })?.roles || 
                          [];
  return {
    hasRole: (requiredRoles: string[]) => {
      if (!requiredRoles || requiredRoles.length === 0) return true;
      return requiredRoles.some(role => roles.includes(role));
    },
    roles
  };
};