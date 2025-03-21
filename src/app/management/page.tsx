import Breadcrumb from '../../components/Common/Breadcrumb';
import StartManagement from '../../components/Management/StartManagement';

export const metadata = {
  title: 'Gestion',
};

const Management = () => {
  return (
    <>
      <Breadcrumb
        pageName="Iniciar Gestion"
        description="Gestiona un nuevo ciclo escolar."
      />
      <StartManagement />
    </>
  );
};

export default Management;