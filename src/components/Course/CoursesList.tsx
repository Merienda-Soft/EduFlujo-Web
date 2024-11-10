import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2'; 
import EditCourseModal from '../../components/Course/EditCourseModal'; 
import AddCourseModal from '../../components/Course/AddCourseModal';
import { useRouter } from 'next/navigation';
import { deleteCourse } from '../../utils/courseService'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faEye, faUserPlus } from '@fortawesome/free-solid-svg-icons';

const CoursesList = () => {
  const [showCourseModal, setShowCourseModal] = useState(false);  
  const [showTeacherModal, setShowTeacherModal] = useState(false);  // Estado para manejar el modal de profesor
  const [courses, setCourses] = useState([]); 
  const [filteredCourses, setFilteredCourses] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter(); // Hook para la navegación

  const [selectedGrade, setSelectedGrade] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedGrade') || 'Primero';
    }
    return 'Primero';
  });

  const [selectedCourse, setSelectedCourse] = useState(null); 
  const [showEditModal, setShowEditModal] = useState(false); 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedGrade', selectedGrade);
    }
  }, [selectedGrade]);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3001/api/courses');
        const data = await response.json();
        const activeCourses = data.filter((course: any) => course.deleted !== 1);
        setCourses(activeCourses);
        filterCoursesByGrade(activeCourses, selectedGrade);  
      } catch (err) {
        setError('Error al cargar los cursos');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [selectedGrade]); 

  const filterCoursesByGrade = (courses: any[], grade: string) => {
    const filtered = courses.filter((course) => course.name.includes(grade));
    setFilteredCourses(filtered);
  };

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const grade = e.target.value;
    setSelectedGrade(grade);
    filterCoursesByGrade(courses, grade);
  };

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course);
    setShowEditModal(true); 
  };

  const handleDeleteCourse = async (courseId: string) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminarlo',
      cancelButtonText: 'Cancelar',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteCourse(courseId);
          const updatedCourses = courses.filter((course: any) => course._id !== courseId);
          setCourses(updatedCourses);
          filterCoursesByGrade(updatedCourses, selectedGrade);

          Swal.fire('Eliminado', 'El curso ha sido eliminado lógicamente.', 'success');
        } catch (error) {
          Swal.fire('Error', 'Hubo un error al eliminar el curso.', 'error');
        }
      }
    });
  };

  // Función para redirigir a la página de detalles del curso.
  const handleViewDetails = (courseId: string) => {
    router.push(`/course/${courseId}`); // Navegación a la página de detalles del curso
  };

  // Función para manejar el clic del botón de agregar profesor
  const handleAddTeacher = (course: any) => {
    setSelectedCourse(course); // Selecciona el curso actual para agregar profesor
    setShowTeacherModal(true);  // Muestra el modal de agregar profesor
  };

  if (loading) return <p>Cargando cursos...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Combo box para seleccionar el grado */}
      <div className="mb-8 flex justify-between items-start space-x-4">
        <div className="flex flex-col">
          <label htmlFor="grade" className="block text-lg font-medium text-gray-700 dark:text-gray-200">
            Selecciona un grado:
          </label>
          <select
            id="grade"
            value={selectedGrade}
            onChange={handleGradeChange}
            className="mt-1 block p-2 border border-gray-300 rounded-md shadow-sm w-48"
          >
            <option value="Primero">Primero</option>
            <option value="Segundo">Segundo</option>
            <option value="Tercero">Tercero</option>
            <option value="Cuarto">Cuarto</option>
            <option value="Quinto">Quinto</option>
            <option value="Sexto">Sexto</option>
          </select>
        </div>

        {/* Botón Ingresar cursos */}
        <button
          onClick={() => setShowCourseModal(true)}
          className="px-4 py-2 bg-blue-900 text-white rounded-md shadow-md hover:bg-blue-700"
        >
          Agregar Curso
        </button>
      </div>

      {/* Lista de cursos filtrados */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course: any) => (
            <div
              key={course._id}
              className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 relative"
            >
              {/* Botón de vista detalles */}
              <button
                onClick={() => handleViewDetails(course._id)}
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
              >
                <FontAwesomeIcon icon={faEye} size="lg" />
              </button>

              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {course.name}
                </h2>
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Materias:</h3>
                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                  {course.materias
                  .filter((materia: any) => materia.deleted != 1) 
                  .map((materia: any) => (
                    <li key={materia._id}>{materia.name}</li>
                  ))}
                </ul>
              </div>
              {/* Footer con los botones de acciones */}
              <div className="flex justify-end mt-6 space-x-2">
                
                {/* Botón de editar curso */}
                <button
                  onClick={() => handleEditCourse(course)}
                  className="px-4 py-2 bg-blue-900 text-white rounded-md shadow-md hover:bg-blue-800 transition duration-200 flex items-center space-x-2"
                >
                  <FontAwesomeIcon icon={faEdit} /> 
                </button>

                {/* Botón de eliminar curso */}
                <button
                  onClick={() => handleDeleteCourse(course._id)}
                  className="px-4 py-2 bg-red-800 text-white rounded-md shadow-md hover:bg-red-700 transition duration-200 flex items-center space-x-2"
                >
                  <FontAwesomeIcon icon={faTrash} /> 
                </button>

                {/* Botón de agregar profesor */}
                {/*<button
                  onClick={() => handleAddTeacher(course)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md shadow-md hover:bg-green-500 transition duration-200 flex items-center space-x-2"
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                </button>*/}
              </div>
            </div>
          ))
        ) : (
          <p>No hay cursos disponibles para este grado.</p>
        )}
      </div>

      {/* Modal de edición */}
      {selectedCourse && (
        <EditCourseModal show={showEditModal} onClose={() => setShowEditModal(false)} course={selectedCourse} />
      )}
      <AddCourseModal show={showCourseModal} onClose={() => setShowCourseModal(false)} />
      
    </div>
  );
};

export default CoursesList;
