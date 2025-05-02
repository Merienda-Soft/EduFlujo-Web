import { getSession } from '@auth0/nextjs-auth0';
import UserList from "../../components/UserManagement/UserList";
import Breadcrumb from "../../components/Common/Breadcrumb";
import CreateUserForm from '../../components/UserManagement/CreateUserForm';
import UnauthorizedAccess from '../../components/Authorization/Unauthorized';
import { redirect } from 'next/navigation';

export const metadata = {
  title: "Lista de Usuarios",
};

export default async function User() {
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
        pageName="Lista de Usuarios"
        description="Gestiona todos los usuarios del sistema. Crea nuevos usuarios, edita permisos y realiza otras acciones administrativas."
      />
      <CreateUserForm />
      <UserList />
    </>
  );
}
