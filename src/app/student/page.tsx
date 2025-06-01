"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useUserRoles } from "../../utils/roleUtils";
import { useRouter } from "next/navigation";
import Breadcrumb from "../../components/Common/Breadcrumb";
import { getCurrentManagementData, isCurrentManagementActive, getManagementGlobal, subscribe } from "../../utils/globalState";
import { getStudents } from "../../utils/studentsService";
import { getTutorByEmail, getStudentByEmail } from "../../utils/tutorshipService";
import Swal from "sweetalert2";
import { getYearManagements } from "../../utils/managementService";
import { setManagementGlobal } from "../../utils/globalState";
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faBookOpen, faTasks } from '@fortawesome/free-solid-svg-icons';

const subjectImages: Record<string, string> = {
  matemáticas: '/images/subject/matematicas.png',
  'ciencias naturales': '/images/subject/c_naturales.png',
  'ciencias sociales': '/images/subject/c_sociales.jpg',
  lenguaje: '/images/subject/lenguaje.webp',
  'técnica tecnológica': '/images/subject/t_tecnologia.webp',
  'artes plásticas': '/images/subject/a_plasticas.jpg',
  'valores espiritualidades y religiones': '/images/subject/religion.jpg',
  'educación física': '/images/subject/e_fisica.jpg',
  'educación musical': '/images/subject/musica.jpg',};

export default function StudentHomePage() {
  const { user, isLoading } = useUser();
  const { hasRole } = useUserRoles();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [activeManagement, setActiveManagement] = useState<any>(getCurrentManagementData());
  const [managements, setManagements] = useState([]);
  const [selectedManagement, setSelectedManagement] = useState(getCurrentManagementData()?.id);
  const [tutorStatus, setTutorStatus] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const subjectsPerPage = 6;

  // Suscribirse a cambios en la gestión
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      const { id } = getManagementGlobal();
      if (id) {
        setSelectedManagement(id);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return;
      setLoading(true);
      try {
        if (hasRole(["tutor"])) {
          const tutorResponse = await getTutorByEmail(user.email);
          if (tutorResponse) {
            const tutorId = tutorResponse.id;
            const studentsResponse = await getStudents(tutorId, "tutor", selectedManagement);
            if (studentsResponse.ok && studentsResponse.data) {
              setTutorStatus(studentsResponse.data.tutor.status);
              setStudentData(studentsResponse.data.students);
              if (studentsResponse.data.students.length > 0) {
                setSelectedStudent(studentsResponse.data.students[0]);
              }
            }
          }
        } else {
          const studentResponse = await getStudentByEmail(user.email);
          if (studentResponse) {
            const studentId = studentResponse.id;
            const studentsResponse = await getStudents(studentId, "student", selectedManagement);
            if (studentsResponse.ok && studentsResponse.data) {
              setStudentData(studentsResponse.data);
              setSelectedStudent(studentsResponse.data);
            }
          }
        }
      } catch (e) {
        console.error('Error:', e);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los datos del estudiante.',
        });
      } finally {
        setLoading(false);
      }
    };
    if (user?.email && !isLoading && selectedManagement) fetchData();
  }, [user, isLoading, selectedManagement]);

  // Inicializar gestión activa desde cookie o globalState
  useEffect(() => {
    let initialManagement = null;
    const stored = Cookies.get('managementGlobal');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.year === 'number' && typeof parsed.id === 'number') {
          initialManagement = parsed.id;
        }
      } catch {}
    }
    if (!initialManagement && getCurrentManagementData()?.id) {
      initialManagement = getCurrentManagementData().id;
    }
    setSelectedManagement(initialManagement);
  }, []);

  useEffect(() => {
    const fetchManagements = async () => {
      try {
        const data = await getYearManagements();
        setManagements(data);
      } catch {}
    };
    fetchManagements();
  }, []);

  const studentOptions = useMemo(() => {
    if (!studentData || !Array.isArray(studentData)) return [];
    return studentData.map((studentInfo: any) => ({
      value: studentInfo.student.id,
      label: `${studentInfo.student.name} ${studentInfo.student.lastname} ${studentInfo.student.second_lastname || ''}`.trim(),
    }));
  }, [studentData]);

  // Manejar cambio de estudiante (tutor)
  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!studentData) return;
    const student = studentData.find((s: any) => s.student.id === Number(e.target.value));
    if (student) {
      setSelectedStudent(student);
      setCurrentPage(1); // Resetear a la primera página al cambiar de estudiante
    }
  };

  const filteredSubjects = useMemo(() => {
    const currentStudent = hasRole(["tutor"]) ? selectedStudent : studentData;
    if (!currentStudent?.courses?.length) return [];
    
    const courseData = currentStudent.courses[0];
    const allSubjects = courseData.subjects || [];
    
    if (!searchTerm) return allSubjects;
    
    return allSubjects.filter((subject: any) => 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [hasRole, selectedStudent, studentData, searchTerm]);

  // Paginación
  const paginatedSubjects = useMemo(() => {
    const startIndex = (currentPage - 1) * subjectsPerPage;
    return filteredSubjects.slice(startIndex, startIndex + subjectsPerPage);
  }, [filteredSubjects, currentPage]);

  const totalPages = Math.ceil(filteredSubjects.length / subjectsPerPage);

  const getSubjectImage = (subjectName: string) => {
    const lowerName = subjectName.toLowerCase();
    console.log('MATERIAS: ', lowerName);
    for (const [key, value] of Object.entries(subjectImages)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }
    return '/images/subject/default.jpg';
  };

  // Renderizar cursos y materias
  const renderCursos = useMemo(() => {
    const currentStudent = hasRole(["tutor"]) ? selectedStudent : studentData;
    
    if (!currentStudent?.courses?.length) {
      return (
        <div className="text-center text-gray-500 py-12">
          <FontAwesomeIcon icon={faBookOpen} className="text-4xl mb-4 text-gray-400" />
          <p className="text-xl">No hay cursos asignados</p>
        </div>
      );
    }
    
    const courseData = currentStudent.courses[0];
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mt-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-cyan-800 dark:text-cyan-200">{courseData.course.course}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredSubjects.length} materias encontradas
            </p>
          </div>
          
          {/* Buscador */}
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar materias..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        
        {/* Grid de materias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedSubjects.map((subject: any) => (
            <div key={subject.id} className="rounded-xl overflow-hidden bg-gradient-to-br from-cyan-100/80 to-white dark:from-cyan-900/40 dark:to-gray-800 shadow-lg border border-cyan-200 dark:border-cyan-800 flex flex-col">
              <div className="relative h-40 overflow-hidden">
                <img
                  src={getSubjectImage(subject.name)}
                  alt={subject.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-xl font-bold text-white">{subject.name}</h3>
                </div>
              </div>
              
              <div className="p-4 flex-grow">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <span className="font-semibold text-cyan-700 dark:text-cyan-200">Profesor:</span>
                  <span>{subject.professor?.name} {subject.professor?.lastname}</span>
                </div>
              </div>
              
              <div className="p-4 border-t border-cyan-200 dark:border-cyan-800">
                <button
                  onClick={() => router.push(`/student/tasks/${subject.id}?courseId=${courseData.course.id}&studentId=${currentStudent.student.id}&materiaName=${encodeURIComponent(subject.name)}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-transparent text-blue-800 dark:text-blue-300 font-semibold hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border border-blue-800 dark:border-blue-300"
                >
                  <FontAwesomeIcon icon={faTasks} />
                  {hasRole(["tutor"]) ? "Tareas y Reportes" : "Mis Tareas y Material de apoyo"}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="inline-flex rounded-md shadow">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border-t border-b border-gray-300 dark:border-gray-600 ${currentPage === page 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </nav>
          </div>
        )}
      </div>
    );
  }, [hasRole, selectedStudent, studentData, router, searchTerm, paginatedSubjects, currentPage, totalPages]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si es tutor y su status no es 1, mostrar mensaje
  if (hasRole(["tutor"]) && tutorStatus !== 1) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              {tutorStatus === 0 ? "Tu solicitud de tutoría ha sido rechazada" :
               tutorStatus === 2 ? "Tu solicitud de tutoría está pendiente de aprobación" :
               "No tienes acceso a esta sección"}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {tutorStatus === 0 ? "Por favor, contacta con la administración para más información." :
               tutorStatus === 2 ? "Estamos revisando tu solicitud. Te notificaremos cuando sea aprobada." :
               "Necesitas ser un tutor aprobado para acceder a esta sección."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <Breadcrumb pageName="Cursos" description={`Gestión ${activeManagement?.management || "Actual"}`} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          {hasRole(["tutor"]) && studentOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="student-select" className="text-sm font-medium text-gray-700 dark:text-gray-200">Estudiante:</label>
              <select
                id="student-select"
                className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                value={selectedStudent?.student?.id || ''}
                onChange={handleStudentChange}
              >
                {studentOptions.map((opt: any) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {renderCursos}
      </div>
    </div>
  );
}