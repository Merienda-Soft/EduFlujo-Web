import { getSession } from '@auth0/nextjs-auth0';
import Breadcrumb from "../../components/Common/Breadcrumb";
import TutorshipRequest from "../../components/Tutor/TutorShipRequest";
import UnauthorizedAccess from '../../components/Authorization/Unauthorized';
import { redirect } from 'next/navigation';
export const metadata = {
  title: "Tutorias",
};

export default async function Tutorship() {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
      redirect('/api/auth/login');
  }

  const roles: string[] = user?.['https://eduflujo.com/roles'] || [];

  if (!roles.includes('tutor')) {
    return <UnauthorizedAccess />;
  }

  return (
    <>
      <Breadcrumb
        pageName="Registro de Tutorias"
        description="Inicia el proceso de registro de tutorias. Asegúrate de tener todos los documentos necesarios y sigue las instrucciones para completar el registro."
      />
      <TutorshipRequest />
    </>
  );
}