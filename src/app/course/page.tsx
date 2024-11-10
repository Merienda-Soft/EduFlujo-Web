import Breadcrumb from '../../components/Common/Breadcrumb';
import CourseClient from '../../components/Course/CourseClient';

export const metadata = {
  title: 'Cursos',
};

const Course = () => {
  return (
    <>
      <Breadcrumb
        pageName="Gestion de Entorno"
        description="Explora los cursos disponibles y crea nuevos cursos."
      />
      <CourseClient />
    </>
  );
};

export default Course;
