"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumb from "../../../../components/Common/Breadcrumb";
import { getActivities } from "../../../../utils/tasksService";
import { getStudentsByCourse } from "../../../../utils/attendanceService";
import { useUser } from '@auth0/nextjs-auth0/client';
import { getProfessorByEmail } from '../../../../utils/tasksService';
import { getManagementGlobal } from '../../../../utils/globalState';
import Swal from "sweetalert2";

const DIMENSIONS = [
  { id: 1, name: "Ser", icon: "❤️", color: "#FF6B6B" },
  { id: 2, name: "Saber", icon: "📚", color: "#4ECDC4" },
  { id: 3, name: "Hacer", icon: "🛠️", color: "#45B7D1" },
  { id: 4, name: "Decidir", icon: "💡", color: "#96CEB4" },
];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function SubjectReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const materiaid = searchParams.get("materiaid");
  const cursoid = searchParams.get("cursoid");
  const teacherid = searchParams.get("teacherid");
  const materiaName = searchParams.get("materiaName") || "Materia";
  const management = getManagementGlobal();

  const [activities, setActivities] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDimension, setSelectedDimension] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const managementId = management?.id?.toString();
      const [activitiesData, studentsData] = await Promise.all([
        getActivities(materiaid, cursoid, teacherid, managementId),
        getStudentsByCourse(cursoid)
      ]);
      setActivities(activitiesData || []);
      setStudents((studentsData && studentsData.ok) ? studentsData.data : []);
    } catch (error: any) {
      Swal.fire("Error", "No se pudieron cargar los datos", "error");
    } finally {
      setLoading(false);
    }
  }, [materiaid, cursoid, teacherid, management]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtros
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const activityDate = new Date(activity.start_date);
      const monthMatch = activityDate.getMonth() === selectedMonth;
      const dimensionMatch = !selectedDimension || activity.dimension_id === selectedDimension;
      return monthMatch && dimensionMatch;
    });
  }, [activities, selectedMonth, selectedDimension]);

  const getStudentGrade = useCallback((studentId: number, taskId: number) => {
    const activity = activities.find(a => a.id === taskId);
    if (!activity?.assignments) return "-";
    const assignment = activity.assignments.find((a: any) => a.student_id === studentId);
    if (!assignment?.qualification) return "-";
    return assignment.qualification.toString().trim();
  }, [activities]);

  const calculateAverage = (studentId: number) => {
    const grades = filteredActivities
      .map(activity => {
        const assignment = activity.assignments.find((a: any) => a.student_id === studentId);
        return assignment?.qualification ? parseFloat(assignment.qualification.trim()) : null;
      })
      .filter(grade => grade !== null);
    if (grades.length === 0) return "-";
    return (grades.reduce((a, b) => a! + b!, 0) / grades.length).toFixed(1);
  };

  // Navegación de meses
  const handlePrevMonth = () => setSelectedMonth(prev => prev === 0 ? 11 : prev - 1);
  const handleNextMonth = () => setSelectedMonth(prev => prev === 11 ? 0 : prev + 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="">
      <Breadcrumb pageName="Registro de Notas" description={materiaName} />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {/* Cabecera */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registro de Notas</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gestión {management?.year || "Actual"}</p>
              <p className="text-base text-gray-700 dark:text-gray-200 font-semibold mt-1">{materiaName}</p>
            </div>
            {/* Selector de mes */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-lg px-4 py-2">
              <button onClick={handlePrevMonth} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="font-semibold text-base">{MONTHS[selectedMonth]}</span>
              <button onClick={handleNextMonth} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filtros de dimensión */}
          <div className="flex gap-2 flex-wrap mb-6">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${!selectedDimension ? "bg-cyan-600 text-white border-cyan-600" : "bg-transparent border-cyan-300 text-cyan-700 dark:text-cyan-200 hover:bg-cyan-50 dark:hover:bg-cyan-800"}`}
              onClick={() => setSelectedDimension(null)}
            >
              <span className="text-lg">🔄</span> Todas
            </button>
            {DIMENSIONS.map(dim => (
              <button
                key={dim.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${selectedDimension === dim.id ? "text-white" : "text-cyan-700 dark:text-cyan-200"}`}
                style={{ background: selectedDimension === dim.id ? dim.color : "transparent", borderColor: dim.color }}
                onClick={() => setSelectedDimension(dim.id)}
              >
                <span className="text-lg">{dim.icon}</span> {dim.name}
              </button>
            ))}
          </div>

          {/* Tabla de calificaciones */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-900 rounded-l-lg">Estudiante</th>
                  {filteredActivities.map(activity => (
                    <th key={activity.id} className="px-4 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-900">
                      {activity.name}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-center text-xs font-bold text-cyan-700 dark:text-cyan-200 bg-gray-100 dark:bg-gray-900 rounded-r-lg">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.student_id} className={idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"}>
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap rounded-l-lg">
                      {`${student.lastname || ''} ${student.second_lastname || ''} ${student.name || ''}`}
                    </td>
                    {filteredActivities.map(activity => {
                      const grade = getStudentGrade(student.student_id, activity.id);
                      const isNumber = !isNaN(Number(grade));
                      return (
                        <td key={activity.id} className="px-4 py-2 text-center font-semibold text-sm whitespace-nowrap">
                          <span className={isNumber ? (Number(grade) >= 51 ? "text-green-600" : "text-red-500") : "text-gray-500"}>
                            {grade}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 text-center font-bold text-base text-cyan-700 dark:text-cyan-200 rounded-r-lg">
                      {calculateAverage(student.student_id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 