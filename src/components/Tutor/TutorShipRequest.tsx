'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { getTutorByEmail } from '../../utils/tutorshipService';
import { getDegree } from '../../utils/managementService';
import { getCourseByDegree, getStudentsByCourse, createTutorShip } from '../../utils/tutorshipService';
import Swal from 'sweetalert2';

interface Tutor {
  id: number;
  name: string;
  lastname: string;
  second_lastname: string;
}

interface Degree {
  id: number;
  degree: string;
}

interface Course {
  id: number;
  course: string;
  parallel: string;
}

interface Student {
  id: number;
  name: string;
  lastname: string;
  second_lastname: string;
}

const TutorshipRequest = () => {
  const { user } = useUser();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [selectedDegree, setSelectedDegree] = useState<number | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [relacion, setRelacion] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'welcome' | 'degree' | 'course' | 'students' | 'confirm'>('welcome');
  const [isLoading, setIsLoading] = useState(false);

  // Obtener información del tutor al cargar el componente
  useEffect(() => {
    const fetchTutorData = async () => {
      if (user?.email) {
        setIsLoading(true);
        try {
          const tutorData = await getTutorByEmail(user.email);
          setTutor(tutorData);
        } catch (error) {
          console.error('Error al obtener datos del tutor:', error);
          Swal.fire('Error', 'No se pudo obtener la información del tutor', 'error');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchTutorData();
  }, [user]);

  // Obtener grados disponibles
  useEffect(() => {
    const fetchDegrees = async () => {
      setIsLoading(true);
      try {
        const degreesData = await getDegree();
        setDegrees(degreesData);
      } catch (error) {
        console.error('Error al obtener grados:', error);
        Swal.fire('Error', 'No se pudo obtener la lista de grados', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDegrees();
  }, []);

  // Obtener cursos cuando se selecciona un grado
  useEffect(() => {
    const fetchCourses = async () => {
      if (selectedDegree) {
        setIsLoading(true);
        try {
          const coursesData = await getCourseByDegree(selectedDegree);
          console.log('Cursos obtenidos:', coursesData);
          
          const currentYear = new Date().getFullYear();

          const currentYearCourses = coursesData.filter(course => 
            course.management?.management === currentYear
          );
          
          setCourses(currentYearCourses);
          setCurrentStep('course');
        } catch (error) {
          console.error('Error al obtener cursos:', error);
          Swal.fire('Error', 'No se pudo obtener la lista de cursos', 'error');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCourses();
  }, [selectedDegree]);

  // Obtener estudiantes cuando se selecciona un curso
  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedCourse) {
        setIsLoading(true);
        try {
          const studentsData = await getStudentsByCourse(selectedCourse);
          setStudents(studentsData);
          setCurrentStep('students');
        } catch (error) {
          console.error('Error al obtener estudiantes:', error);
          Swal.fire('Error', 'No se pudo obtener la lista de estudiantes', 'error');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchStudents();
  }, [selectedCourse]);

  const handleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const handleSubmit = async () => {
    if (!tutor?.id || selectedStudents.length === 0 || !relacion) {
      Swal.fire('Error', 'Por favor complete todos los campos y seleccione al menos un estudiante', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await createTutorShip({
        tutorId: tutor.id,
        studentIds: selectedStudents,
        relacion
      });
      
      Swal.fire('Éxito', 'Tutoría registrada correctamente', 'success');
      setCurrentStep('welcome');
      setSelectedDegree(null);
      setSelectedCourse(null);
      setSelectedStudents([]);
      setRelacion('');
    } catch (error) {
      console.error('Error al registrar tutoría:', error);
      Swal.fire('Error', 'No se pudo registrar la tutoría', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="rounded-sm border-strok p-20 pb-20">
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-primary-dark"></div>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Paso 1: Bienvenida */}
            {currentStep === 'welcome' && tutor && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Columna de texto */}
                <div className="text-left">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                    ¡Bienvenido, {tutor.name} {tutor.lastname} {tutor.second_lastname}!
                  </h2>
                  <div className="mb-6 text-gray-600 dark:text-gray-300 space-y-4">
                    <p>¡Nos alegra tenerte aquí!</p>
                    
                    <p>
                      Como padre, madre o tutor, sabemos que el bienestar y progreso de tu estudiante 
                      es lo más importante para ti. Este proceso te permitirá:
                    </p>
                    
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Estar cerca de su desarrollo académico</li>
                      <li>Conocer sus avances en tiempo real</li>
                      <li>Apoyarlo mejor en su camino educativo</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setCurrentStep('degree')}
                    className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark dark:hover:bg-primary/90 transition"
                  >
                    Comenzar
                  </button>
                </div>
              
                {/* Columna de imagen */}
                <div className="hidden md:block">
                  <img 
                    src="/images/tutor/tutor_banner.webp" 
                    alt="Padres y estudiantes" 
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                </div>
              </div>
            )}

            {/* Paso 2: Selección de grado */}
            {currentStep === 'degree' && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                  1. Selecciona el grado del estudiante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {degrees.map(degree => (
                    <button
                      key={degree.id}
                      onClick={() => setSelectedDegree(degree.id)}
                      className={`p-4 border rounded-md text-center transition ${
                        selectedDegree === degree.id 
                          ? 'border-primary bg-primary/10 text-primary dark:border-primary-dark dark:bg-primary-dark/10 dark:text-primary-dark'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-white'
                      }`}
                    >
                      {degree.degree}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Paso 3: Selección de curso */}
            {currentStep === 'course' && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                  2. Selecciona el curso de tu estudiante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {courses.map(course => (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourse(course.id)}
                      className={`p-4 border rounded-md text-center transition ${
                        selectedCourse === course.id
                          ? 'border-primary bg-primary/10 text-primary dark:border-primary-dark dark:bg-primary-dark/10 dark:text-primary-dark'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-white'
                      }`}
                    >
                      {course.course.trim()}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentStep('degree')}
                  className="mt-4 text-primary dark:text-primary-dark hover:underline"
                >
                  ← Volver a selección de grado
                </button>
              </div>
            )}

            {/* Paso 4: Selección de estudiantes */}
            {currentStep === 'students' && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                  3. Selecciona tus estudiantes
                </h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Relación con el estudiante
                  </label>
                  <select
                    value={relacion}
                    onChange={(e) => setRelacion(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:border-primary dark:focus:border-primary-dark focus:ring-1 focus:ring-primary dark:focus:ring-primary-dark"
                    required
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="Madre">Madre</option>
                    <option value="Padre">Padre</option>
                    <option value="Tutor">Tutor</option>
                    <option value="Apoderado">Apoderado</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {students.map(student => (
                    <div
                      key={student.id}
                      onClick={() => handleStudentSelection(student.id)}
                      className={`p-4 border rounded-md cursor-pointer transition ${
                        selectedStudents.includes(student.id)
                          ? 'border-primary bg-primary/10 text-primary dark:border-primary-dark dark:bg-primary-dark/10 dark:text-primary-dark'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-white'
                      }`}
                    >
                      <h4 className="font-medium">{student.name} {student.lastname} {student.second_lastname}</h4>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep('course')}
                    className="text-primary dark:text-primary-dark hover:underline"
                  >
                    ← Volver a selección de curso
                  </button>
                  <button
                    onClick={() => setCurrentStep('confirm')}
                    disabled={selectedStudents.length === 0 || !relacion}
                    className={`px-4 py-2 rounded-md transition ${
                      selectedStudents.length === 0 || !relacion
                        ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400'
                        : 'bg-primary text-white hover:bg-primary-dark dark:hover:bg-primary/90'
                    }`}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* Paso 5: Confirmación */}
            {currentStep === 'confirm' && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                  4. Confirma los datos
                </h3>
                
                <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Tutor:</h4>
                  <p className="text-gray-800 dark:text-white">{tutor?.name} {tutor?.lastname} {tutor?.second_lastname}</p>
                  
                  <h4 className="font-medium mt-4 mb-2 text-gray-700 dark:text-gray-300">Relación:</h4>
                  <p className="text-gray-800 dark:text-white">{relacion}</p>
                  
                  <h4 className="font-medium mt-4 mb-2 text-gray-700 dark:text-gray-300">Estudiantes seleccionados:</h4>
                  <ul className="list-disc pl-5 text-gray-800 dark:text-white">
                    {students
                      .filter(student => selectedStudents.includes(student.id))
                      .map(student => (
                        <li key={student.id}>
                          {student.name} {student.lastname} {student.second_lastname}
                        </li>
                      ))}
                  </ul>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep('students')}
                    className="text-primary dark:text-primary-dark hover:underline"
                  >
                    ← Volver a selección de estudiantes
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark dark:hover:bg-primary/90 transition"
                  >
                    Confirmar y Registrar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
  );
};

export default TutorshipRequest;