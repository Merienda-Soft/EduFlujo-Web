'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { redirect } from 'next/navigation';
import Breadcrumb from '../../components/Common/Breadcrumb';
import AcademicYear from '../../components/Management/AcademicYear';
import UnauthorizedAccess from '../../components/Authorization/Unauthorized';

const Academic = () => {
  const { user, isLoading } = useUser();

  if (!user) {
    redirect('/api/auth/login');
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const roles: string[] = (user?.['https://eduflujo.com/roles'] as string[]) || [];
  
  if (!roles.includes('admin')) {
    return <UnauthorizedAccess />;
  }

  return (
    <>
      <Breadcrumb
        pageName="Iniciar Gestion"
        description="Gestiona un nuevo ciclo escolar."
      />
      <AcademicYear />
    </>
  );
};

export default Academic;