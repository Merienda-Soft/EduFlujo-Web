'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useUserRoles } from '../../../utils/roleUtils';
import { useRouter } from 'next/navigation';
import Breadcrumb from '../../../components/Common/Breadcrumb';
import { getCurrentManagementData, isCurrentManagementActive } from '../../../utils/globalState';
import { getProfessorByEmail } from '../../../utils/tasksService';
import Swal from 'sweetalert2';

export default function ReportsPage() {
  const { user, isLoading } = useUser();
  const { hasRole } = useUserRoles();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [professor, setProfessor] = useState<any | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Cargar datos reales del profesor y cursos asignados
  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) return;
      try {
        const data = await getProfessorByEmail(user.email);
        setProfessor(data.professor);
        // Filtrar por la gestión seleccionada
        const filtered = (data.professor.assignments || []).filter(a => a.management_id === getCurrentManagementData().id);
        setAssignments(filtered);
      } catch (e) {
        setError('No se pudieron cargar los cursos.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.email && getCurrentManagementData().id) loadData();
  }, [user]);

  // Agrupar assignments por curso
  const groupedCourses = Object.values(assignments.reduce((acc, a) => {
    const key = `${a.course?.course}-${a.course?.parallel?.trim()}`;
    if (!acc[key]) {
      acc[key] = {
        course: a.course?.course,
        parallel: a.course?.parallel?.trim(),
        courseId: a.course?.id,
        materias: [],
      };
    }
    acc[key].materias.push({
      id: a.subject?.id,
      nombre: a.subject?.subject,
      quarter: a.quarter,
    });
    return acc;
  }, {}));

  // Descargar informe trimestral
  const handleCourseReport = async (curso: any) => {
    Swal.fire({
      title: "Generando reporte...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      // Aquí deberías llamar a tu API para descargar el reporte
      await new Promise((res) => setTimeout(res, 1200));
      Swal.close();
      Swal.fire("Éxito", `El reporte del curso ${curso.course} ${curso.parallel} ha sido descargado`, "success");
    } catch (error) {
      Swal.close();
      Swal.fire("Error", "No se pudo descargar el reporte", "error");
    }
  };

  // Ir al reporte de materia
  const navigateToSubjectReport = (curso: any, materia: any) => {
    router.push(
      `/professor/reports/subject?materiaid=${materia.id}&cursoid=${curso.courseId}&teacherid=${professor?.id}&materiaName=${encodeURIComponent(materia.nombre)}&management=${encodeURIComponent(JSON.stringify(getCurrentManagementData))}`
    );
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !hasRole(["professor"])) {
    return null;
  }

  return (
    <div className="">
      <Breadcrumb pageName="Reportes" description={`Gestión ${getCurrentManagementData()?.management || "Actual"}`} />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Reportes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Descarga informes trimestrales y accede a reportes por materia</p>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Mis Cursos</h2>
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groupedCourses.map((curso: any, idx: number) => (
              <div key={idx} className="rounded-xl bg-gradient-to-br from-cyan-100/80 to-white dark:from-cyan-900/40 dark:to-gray-800 shadow-lg p-6 border border-cyan-200 dark:border-cyan-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-cyan-800 dark:text-cyan-200">{curso.course}</span>
                  <button
                    onClick={() => handleCourseReport(curso)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-400 text-cyan-700 dark:text-cyan-200 bg-cyan-50 dark:bg-cyan-900/30 hover:bg-cyan-100 dark:hover:bg-cyan-800 transition-colors font-semibold text-sm"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    Informe Trimestral
                  </button>
                </div>
                <div className="space-y-2">
                  {curso.materias.map((materia: any, subIdx: number) => (
                    <button
                      key={subIdx}
                      onClick={() => navigateToSubjectReport(curso, materia)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-cyan-50 dark:hover:bg-cyan-800 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 transition-colors"
                    >
                      <svg className="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v3a2 2 0 002 2zm0 0v6m0 0a2 2 0 002 2h2a2 2 0 002-2v-6" />
                      </svg>
                      <span className="flex-1 text-left font-medium">{materia.nombre}</span>
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 