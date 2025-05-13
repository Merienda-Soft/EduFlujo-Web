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
          console.log('auth:', studentResponse);
          if (studentResponse) {
            const studentId = studentResponse.id;
            const studentsResponse = await getStudents(studentId, "student", selectedManagement);
            console.log('Respuesta de estudiante:', studentResponse);
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

  // Cargar gestiones
  useEffect(() => {
    const fetchManagements = async () => {
      try {
        const data = await getYearManagements();
        setManagements(data);
      } catch {}
    };
    fetchManagements();
  }, []);

  // Opciones para el combo de estudiantes (tutor)
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
    if (student) setSelectedStudent(student);
  };

  // Renderizar cursos y materias
  const renderCursos = useMemo(() => {
    
    const currentStudent = hasRole(["tutor"]) ? selectedStudent : studentData;
    
    if (!currentStudent?.courses?.length) {
      return (
        <div className="text-center text-gray-500 py-12">No hay cursos asignados</div>
      );
    }
    
    const courseData = currentStudent.courses[0];
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-cyan-800 dark:text-cyan-200">{courseData.course.course}</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courseData.subjects.map((subject: any) => (
            <div key={subject.id} className="rounded-xl bg-gradient-to-br from-cyan-100/80 to-white dark:from-cyan-900/40 dark:to-gray-800 shadow-lg p-6 border border-cyan-200 dark:border-cyan-800 flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📚</span>
                <span className="font-bold text-lg text-gray-700 dark:text-gray-200">{subject.name}</span>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-cyan-700 dark:text-cyan-200">Profesor:</span>
                  <span>{subject.professor?.name} {subject.professor?.lastname}</span>
                </div>
              </div>
              <button
                onClick={() => router.push(`/student/tasks/${subject.id}?courseId=${courseData.course.id}&studentId=${currentStudent.student.id}&materiaName=${encodeURIComponent(subject.name)}`)}
                className="mt-4 px-4 py-2 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition-colors"
              >
                Ver Tareas y Reportes
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }, [hasRole, selectedStudent, studentData, router]);

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