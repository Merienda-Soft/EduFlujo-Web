import Breadcrumb from "../../components/Common/Breadcrumb";
import TutorshipRequest from "../../components/Tutor/TutorShipRequest";


import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tutorias",
};

const Tutorship = () => {
  return (
    <>
      <Breadcrumb
        pageName="Registro de Tutorias"
        description="Inicia el proceso de registro de tutorias. Asegúrate de tener todos los documentos necesarios y sigue las instrucciones para completar el registro."
      />
      <TutorshipRequest />
    </>
  );
};

export default Tutorship;