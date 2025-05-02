import { getSession } from '@auth0/nextjs-auth0';
import Breadcrumb from '../../components/Common/Breadcrumb';
import StartManagement from '../../components/Management/StartManagement';
import UnauthorizedAccess from '../../components/Authorization/Unauthorized';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Gestión',
};

export default async function Management() {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
      redirect('/api/auth/login');
  }
  
  const roles: string[] = user?.['https://eduflujo.com/roles'] || [];
  
  if (!roles.includes('admin')) {
    return <UnauthorizedAccess />;
  }

  return (
    <>
      <Breadcrumb
        pageName="Iniciar Gestión"
        description="Gestiona un nuevo ciclo escolar."
      />
      <StartManagement />
    </>
  );
}