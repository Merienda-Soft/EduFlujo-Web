import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';
import Breadcrumb from '../../components/Common/Breadcrumb';
import dynamic from 'next/dynamic';
import UnauthorizedAccess from '../../components/Authorization/Unauthorized';

export const metadata = {
  title: 'Cursos',
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-[200px] w-full">
    <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
);

const CourseClient = dynamic(
  () => import('../../components/Course/CourseClient'),
  { 
    ssr: false,
    loading: () => <LoadingSpinner />
  }
);

export default async function Course() {
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
        pageName="Gestión de Entorno"
        description="Explora los cursos disponibles y crea nuevos cursos."
      />
      <CourseClient />
    </>
  );
}