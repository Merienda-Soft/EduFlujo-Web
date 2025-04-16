'use client';
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import EditCourseModal from '../../components/Course/EditCourseModal';
import AddCourseModal from '../../components/Course/AddCourseModal';
import { useRouter } from 'next/navigation';
import { deleteCourse } from '../../utils/courseService';
import { getDegree } from '../../utils/managementService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faEye } from '@fortawesome/free-solid-svg-icons';
import { managementGlobal } from '../../utils/globalState';

interface Degree {
  id: number;
  degree: string;
}

interface Subject {
  id: number;
  subject: string;
}

interface Curriculum {
  id: number;
  subject: Subject;
}

interface Management {
  id: number;
  management: number;
}

interface Course {
  id: number;
  parallel: string;
  course: string;
  degree_id: number;
  management_id: number;
  degree: Degree;
  management: Management;
  curriculums: Curriculum[];
}

const CoursesList = () => {
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const [selectedDegreeId, setSelectedDegreeId] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const isCurrentYear = managementGlobal.year === new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener grados y cursos en paralelo
        const [degreesData, coursesData] = await Promise.all([
          getDegree(),
          fetchCourses()
        ]);

        setDegrees(degreesData);
        
        // Establecer el primer grado como seleccionado por defecto si existe
        if (degreesData.length > 0) {
          setSelectedDegreeId(degreesData[0].id);
        }
        
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDegreeId !== null) {
      const filtered = courses.filter(course => course.degree_id === selectedDegreeId)
                              .sort((a, b) => a.parallel.localeCompare(b.parallel));
      setFilteredCourses(filtered);
    }
  }, [courses, selectedDegreeId]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/course');
      if (!response.ok) throw new Error('Error al obtener cursos');
      const data: Course[] = await response.json();
      
      // Filtrar por el año de gestión global
      const activeCourses = data.filter(course => 
        course.management.management === managementGlobal.year
      );
      
      setCourses(activeCourses);
      return activeCourses;
    } catch (err) {
      console.error('Error al obtener cursos:', err);
      setError('Error al cargar los cursos');
      throw err;
    }
  };

  const handleDegreeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDegreeId(Number(e.target.value));
  };

  const selectedGrade = degrees.find(d => d.id === selectedDegreeId)?.degree || '';

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowEditModal(true);
  };

  const handleDeleteCourse = async (courseId: number) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminarlo',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await deleteCourse(courseId.toString());
        
        // Actualizar lista de cursos
        const updatedCourses = courses.filter(course => course.id !== courseId);
        setCourses(updatedCourses);
        
        Swal.fire('Eliminado', 'El curso ha sido eliminado.', 'success');
      } catch (error) {
        console.error('Error al eliminar curso:', error);
        Swal.fire('Error', 'Hubo un error al eliminar el curso.', 'error');
      }
    }
  };

  const handleViewDetails = (courseId: number) => {
    router.push(`/course/${courseId}`);
  };

  const existingParallels = filteredCourses.map(course => 
    course.parallel.trim()
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">
          Gestión de Cursos - {managementGlobal.year}
        </h1>
        
        {isCurrentYear && (
          <button
            onClick={() => setShowCourseModal(true)}
            className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-md shadow transition-colors"
          >
            Agregar Nuevo Curso
          </button>
        )}
      </div>

      {/* Selector de grado */}
      <div className="mb-6">
        <label htmlFor="degree-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Seleccionar Grado
        </label>
        <select
          id="degree-select"
          value={selectedDegreeId || ''}
          onChange={handleDegreeChange}
          className="block w-full md:w-64 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          disabled={degrees.length === 0}
        >
          {degrees.map(degree => (
            <option key={degree.id} value={degree.id}>
              {degree.degree}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de cursos */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <div
            key={course.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col justify-between h-full"
          >
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  {course.course}
                </h2>
                <button
                  onClick={() => handleViewDetails(course.id)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                  title="Ver detalles"
                >
                  Ver detalles <FontAwesomeIcon icon={faEye} />
                </button>
              </div>
          
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">
                Materias:
              </h3>
              <ul className="space-y-1 flex-grow">
                {course.curriculums.map(curriculum => (
                  <li key={curriculum.id} className="text-gray-600 dark:text-gray-400">
                    • {curriculum.subject.subject}
                  </li>
                ))}
              </ul>
          
              {isCurrentYear && (
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="text-blue-900 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Editar curso"
                  >
                    Editar <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="text-red-800 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                    title="Eliminar curso"
                  >
                    Eliminar <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              )}
            </div>
          </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No se encontraron cursos para el grado seleccionado en la gestión {managementGlobal.year}
          </p>
        </div>
      )}

        <AddCourseModal
          show={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          selectedGrade={selectedGrade}
          selectedGradeId={selectedDegreeId}
          existingParallels={existingParallels}
          refreshCourses={fetchCourses}
        />
        <EditCourseModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          course={
            selectedCourse
              ? {
                  id: selectedCourse.id,
                  course: selectedCourse.course,
                  parallel: selectedCourse.parallel,
                  degree_id: selectedCourse.degree_id,
                  degree: selectedCourse.degree.degree,
                  subject_ids: selectedCourse.curriculums.map((c) => c.subject.id),
                }
              : null
          }
        />
        
    </div>
  );
};

export default CoursesList;