import Breadcrumb from "../../components/Common/Breadcrumb";
import TutorRegister from "../../components/Tutor/TutorRegister";
import dynamic from 'next/dynamic';

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tutor",
};

const Tutor = () => {
  return (
    <>
      <Breadcrumb
        pageName="Registro de Tutor"
        description="Registrate en el sitema para gestionar tus tutorias. Completa el formulario y sube los documentos necesarios para iniciar el proceso."
      />
      <TutorRegister />
    </>
  );
};

export default Tutor;
