'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useUserRoles } from '../../../utils/roleUtils';
import { useRouter, useSearchParams } from 'next/navigation';
import Breadcrumb from '../../../components/Common/Breadcrumb';
import { getStudentsByCourse, registerAttendance, getAttendanceByCourseSubjectDate, updateAttendanceRecord } from '../../../utils/attendanceService';
import { getCurrentManagementData, isCurrentManagementActive, getManagementGlobal, subscribe } from '../../../utils/globalState';
import { getProfessorByEmail } from '../../../utils/tasksService';
import Swal from 'sweetalert2';

// Constantes para los estados de asistencia
const ATTENDANCE_STATES = {
  PRESENT: 'P',
  ABSENT: 'A',
  JUSTIFIED: 'J'
};

const ATTENDANCE_LABELS = {
  [ATTENDANCE_STATES.PRESENT]: 'Presente',
  [ATTENDANCE_STATES.ABSENT]: 'Ausente',
  [ATTENDANCE_STATES.JUSTIFIED]: 'Licencia'
};

interface AttendanceValue {
  status: string;
  record_id?: number;
}

interface AttendanceRecord {
  student_id: number;
  status: string;
  id?: number;
}

interface Student {
  student_id: number;
  name: string;
  lastname: string;
  second_lastname?: string;
}

interface AttendanceState {
  [key: string]: AttendanceValue | string;
}

export default function AttendancePage() {
  const { user, isLoading } = useUser();
  const { hasRole } = useUserRoles();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendances, setAttendances] = useState<AttendanceState>({});
  const [existingAttendance, setExistingAttendance] = useState(false);
  const [attendanceId, setAttendanceId] = useState<number | null>(null);
  const [originalAttendances, setOriginalAttendances] = useState<AttendanceState>({});
  const [professor, setProfessor] = useState<any | null>(null);
  const [selectedManagement, setSelectedManagement] = useState(getCurrentManagementData()?.id);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    justified: 0
  });

  const subjectId = searchParams?.get('subjectId');
  const courseId = searchParams?.get('courseId');

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

  // Load professor data
  useEffect(() => {
    const loadProfessor = async () => {
      if (!user?.email) return;
      try {
        const data = await getProfessorByEmail(user.email);
        setProfessor(data.professor);
      } catch (error) {
        console.error('Error al cargar los datos del profesor:', error);
      }
    };
    loadProfessor();
  }, [user]);

  // Función para cargar estudiantes y verificar asistencias existentes
  const fetchData = async () => {
    if (!courseId || !subjectId || !professor || !selectedManagement) return;
    
    setLoading(true);
    try {
      // Cargar estudiantes del curso
      const studentsResponse = await getStudentsByCourse(courseId);
      
      if (studentsResponse && studentsResponse.ok && Array.isArray(studentsResponse.data)) {
        const studentsData = studentsResponse.data;
        setStudents(studentsData);
        
        // Inicializar asistencias por defecto
        const newAttendances = {};
        studentsData.forEach(student => {
          newAttendances[student.student_id] = ATTENDANCE_STATES.PRESENT;
        });
        
        // Verificar si ya existe una asistencia para esta fecha
        const dateString = formatDate(selectedDate);
        
        try {
          const existingData = await getAttendanceByCourseSubjectDate(
            Number(courseId),
            Number(subjectId),
            dateString
          );
          
          if (existingData && existingData.ok && existingData.data) {
            if (existingData.data.id) {
              setAttendanceId(existingData.data.id);
            }
            
            const recordsMap = {};
            existingData.data.records.forEach(record => {
              if (record && record.student_id !== undefined && record.status) {
                recordsMap[record.student_id] = {
                  status: record.status.trim(),
                  record_id: record.id
                };
              }
            });
            
            if (Object.keys(recordsMap).length > 0) {
              setAttendances(recordsMap);
              setExistingAttendance(true);
              setOriginalAttendances(JSON.parse(JSON.stringify(recordsMap)));
            } else {
              setAttendances(newAttendances);
              setExistingAttendance(false);
            }
          } else {
            setAttendances(newAttendances);
            setExistingAttendance(false);
          }
        } catch (error) {
          console.error("Error al cargar asistencias:", error);
          setAttendances(newAttendances);
          setExistingAttendance(false);
        }
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos de asistencia'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !hasRole(['professor'])) {
      router.push('/');
    }
  }, [isLoading, hasRole, router]);

  useEffect(() => {
    if (professor && selectedManagement) {
      fetchData();
    }
  }, [selectedDate, professor, selectedManagement]);

  // Actualizar estadísticas cuando cambian las asistencias
  useEffect(() => {
    const newStats = {
      present: 0,
      absent: 0,
      justified: 0
    };

    Object.values(attendances).forEach(value => {
      const status = typeof value === 'object' ? (value as AttendanceValue).status : value;
      switch (status) {
        case ATTENDANCE_STATES.PRESENT:
          newStats.present++;
          break;
        case ATTENDANCE_STATES.ABSENT:
          newStats.absent++;
          break;
        case ATTENDANCE_STATES.JUSTIFIED:
          newStats.justified++;
          break;
      }
    });

    setStats(newStats);
  }, [attendances]);

  // Función para formatear la fecha a YYYY-MM-DD
  const formatDate = (date: Date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  // Función para formatear la fecha como '6 mayo'
  const formatDayMonth = (date: Date) => {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${date.getDate()} ${meses[date.getMonth()]}`;
  };

  // Manejar el cambio de asistencia
  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendances(prev => {
      const currentValue = prev[studentId];
      
      if (typeof currentValue === 'object' && currentValue.record_id) {
        return {
          ...prev,
          [studentId]: {
            status: status,
            record_id: currentValue.record_id
          }
        };
      }
      
      return {
        ...prev,
        [studentId]: status
      };
    });
  };

  // Guardar la asistencia
  const handleSaveAttendance = async () => {
    if (!getCurrentManagementData()?.id || !professor?.id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontraron los datos necesarios para guardar la asistencia'
      });
      return;
    }

    setSaving(true);
    try {
      const dateString = formatDate(selectedDate);
      
      if (existingAttendance && attendanceId) {
        const changedStudents = Object.keys(attendances).filter(studentId => {
          const currentValue = attendances[studentId];
          const originalValue = originalAttendances[studentId];
          
          const currentStatus = typeof currentValue === 'object' ? (currentValue as AttendanceValue).status : currentValue;
          const originalStatus = typeof originalValue === 'object' ? (originalValue as AttendanceValue).status : originalValue;
          
          return currentStatus !== originalStatus;
        });
        
        if (changedStudents.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'Información',
            text: 'No hay cambios para guardar'
          });
          setSaving(false);
          return;
        }
        
        const studentsData = changedStudents.map(studentId => {
          const currentValue = attendances[studentId];
          const status = typeof currentValue === 'object' ? (currentValue as AttendanceValue).status : currentValue;
          
          return {
            student_id: parseInt(studentId),
            status_attendance: status
          };
        });
        
        const updateData = {
          attendance_id: attendanceId,
          students: studentsData
        };
        
        const response = await updateAttendanceRecord(updateData);
        
        if (response && response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Asistencia actualizada correctamente',
            timer: 1500,
            showConfirmButton: false
          });
          setOriginalAttendances(JSON.parse(JSON.stringify(attendances)));
        } else {
          throw new Error('Error al actualizar la asistencia');
        }
      } else {
        const quarter = "Q1";
        
        const attendanceData = {
          attendance_date: dateString,
          quarter: quarter,
          management_id: Number(getCurrentManagementData().id),
          subject_id: Number(subjectId),
          professor_id: professor.id,
          course_id: Number(courseId)
        };
        
        const recordsData = Object.keys(attendances).map(studentId => {
          const currentValue = attendances[studentId];
          const status = typeof currentValue === 'object' ? (currentValue as AttendanceValue).status : currentValue;
          
          return {
            student_id: parseInt(studentId),
            status_attendance: status
          };
        });
        const response = await registerAttendance(attendanceData, recordsData);
        
        if (response && response.ok) {
          if (response.data && response.data.id) {
            setAttendanceId(response.data.id);
          }
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Asistencia guardada correctamente',
            timer: 1500,
            showConfirmButton: false
          });
          setExistingAttendance(true);
        } else {
          throw new Error('Error al guardar la asistencia');
        }
      }
      
      fetchData();
      
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `No se pudo guardar la asistencia: ${error.message}`
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 lg:pt-[150px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !hasRole(['professor'])) {
    return null;
  }

  return (
    <div className="">
      <Breadcrumb pageName="Asistencias" description="Gestión de asistencias para la materia" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Asistencias</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {students.length} estudiantes
              </p>
            </div>
            
            <div className="flex items-center gap-6">
                  <span className="ml-2 text-base text-gray-700 dark:text-gray-200 font-semibold">Actual: {formatDayMonth(selectedDate)}</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Fecha:</span>
                  <input
                    type="date"
                    value={formatDate(selectedDate)}
                    onChange={(e) => {
                      const [year, month, day] = e.target.value.split('-').map(Number);
                      setSelectedDate(new Date(year, month - 1, day));
                    }}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${existingAttendance
                    ? stats.justified === students.length
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                    : 'bg-yellow-500'}`} />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {existingAttendance ?
                      stats.justified === students.length ? 'Solo licencias' : 'Asistencia registrada'
                      : 'Sin registrar'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className={`inline-flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                )}
                {existingAttendance ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Presentes</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absent}</div>
              <div className="text-sm text-red-600 dark:text-red-400">Ausentes</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.justified}</div>
              <div className="text-sm text-orange-600 dark:text-orange-400">Justificados</div>
            </div>
          </div>

          {/* Lista de estudiantes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students
              .sort((a, b) => a.lastname.localeCompare(b.lastname))
              .map((student) => {
                const currentValue = attendances[student.student_id];
                const currentStatus = typeof currentValue === 'object' ? 
                  currentValue.status : currentValue;
                
                let statusColor;
                switch(currentStatus) {
                  case ATTENDANCE_STATES.PRESENT: 
                    statusColor = 'bg-green-500'; break;
                  case ATTENDANCE_STATES.ABSENT: 
                    statusColor = 'bg-red-500'; break;
                  case ATTENDANCE_STATES.JUSTIFIED: 
                    statusColor = 'bg-yellow-500'; break;
                }
                
                return (
                  <div
                    key={student.student_id}
                    className={`flex flex-col p-4 rounded-lg border-l-4 ${statusColor} bg-white dark:bg-gray-700 shadow-sm`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {student.lastname} {student.second_lastname || ''} {student.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {ATTENDANCE_LABELS[currentStatus]}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAttendanceChange(student.student_id.toString(), ATTENDANCE_STATES.PRESENT)}
                        className={`flex-1 py-2 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-colors ${
                          currentStatus === ATTENDANCE_STATES.PRESENT
                            ? 'bg-green-500 text-white border-green-500'
                            : 'border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-900'
                        }`}
                      >
                        Presente
                      </button>
                      
                      <button
                        onClick={() => handleAttendanceChange(student.student_id.toString(), ATTENDANCE_STATES.ABSENT)}
                        className={`flex-1 py-2 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-colors ${
                          currentStatus === ATTENDANCE_STATES.ABSENT
                            ? 'bg-red-500 text-white border-red-500'
                            : 'border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900'
                        }`}
                      >
                        Ausente
                      </button>
                      
                      <button
                        onClick={() => handleAttendanceChange(student.student_id.toString(), ATTENDANCE_STATES.JUSTIFIED)}
                        className={`flex-1 py-2 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-colors ${
                          currentStatus === ATTENDANCE_STATES.JUSTIFIED
                            ? 'bg-orange-400 dark:bg-orange-400 text-orange-900 dark:text-orange-900 border-orange-500'
                            : 'border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900'
                        }`}
                      >
                        Licencia
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
} 