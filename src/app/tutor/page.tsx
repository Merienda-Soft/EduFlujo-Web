import Breadcrumb from "../../components/Common/Breadcrumb";
import TutorRegister from "../../components/Tutor/TutorRegister";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tutorias",
};

const Tutor = () => {
  return (
    <>
      <Breadcrumb
        pageName="Registro de Tutorias"
        description="Inicia el proceso de registro de tutorias. Asegúrate de tener todos los documentos necesarios y sigue las instrucciones para completar el registro."
      />
      <TutorRegister />
    </>
  );
};

export default Tutor;
