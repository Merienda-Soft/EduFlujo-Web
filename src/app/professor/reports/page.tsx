'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useUserRoles } from '../../../utils/roleUtils';
import { useRouter } from 'next/navigation';
import Breadcrumb from '../../../components/Common/Breadcrumb';
import { getCurrentManagementData, isCurrentManagementActive, getManagementGlobal, subscribe } from '../../../utils/globalState';
import { getProfessorByEmail, getTasksReportByCourse } from '../../../utils/tasksService';
import { getCentralizadorReport, getBoletinesReport } from '../../../utils/reportsService';
import Swal from 'sweetalert2';

export default function ReportsPage() {
  const { user, isLoading } = useUser();
  const { hasRole } = useUserRoles();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [professor, setProfessor] = useState<any | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [selectedManagement, setSelectedManagement] = useState(getCurrentManagementData()?.id);

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

  // Cargar datos reales del profesor y cursos asignados
  useEffect(() => {
    const loadData = async () => {
      if (!user?.email || !selectedManagement) return;
      try {
        const data = await getProfessorByEmail(user.email);
        setProfessor(data.professor);
        // Filtrar por la gestión seleccionada
        const filtered = (data.professor.assignments || []).filter(a => a.management_id === selectedManagement);
        setAssignments(filtered);
      } catch (e) {
        setError('No se pudieron cargar los cursos.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.email && selectedManagement) loadData();
  }, [user, selectedManagement]);

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

  // Mostrar opciones de descarga
  const handleCourseReport = async (curso: any) => {
    if (!professor?.id || !selectedManagement) {
      Swal.fire("Error", "No se pudo obtener la información necesaria para generar el reporte", "error");
      return;
    }

    // Verificar si es profesor técnico (is_tecnical = 1)
    const isTechnicalProfessor = professor.is_tecnical === 1;
    
    // Determinar qué opciones mostrar
    const showCentralizadorAndBoletines = !isTechnicalProfessor; // Solo mostrar si NO es técnico (is_tecnical = 0)

    const { value: reportType } = await Swal.fire({
      title: '<span style="color: #E5E7EB;">Opciones de Descarga</span>',
      html: `
        <div style="background: #374151; border-radius: 8px; padding: 0;">
          <div style="padding: 16px; border-bottom: 1px solid #4B5563;">
            <p style="color: #9CA3AF; font-size: 14px; margin: 0;">${curso.course} - Paralelo ${curso.parallel}</p>
          </div>
          <div style="padding: 24px; display: grid; grid-template-columns: ${showCentralizadorAndBoletines ? '1fr 1fr 1fr' : '1fr'}; gap: 16px; justify-items: center;">
            <!-- Informe Trimestral -->
            <div class="report-option" data-value="informe-trimestral" style="display: flex; flex-direction: column; align-items: center; padding: 20px 16px; border: 2px solid #1E40AF; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; background: #1E3A8A; text-align: center;">
              <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #3B82F6; border-radius: 50%; margin-bottom: 12px;">
                <svg style="width: 24px; height: 24px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
              </div>
              <div>
                <h3 style="color: white; font-weight: 600; margin: 0 0 4px 0; font-size: 16px;">Informe<br/>Trimestral</h3>
                <p style="color: #93C5FD; font-size: 12px; margin: 0;">Actividades por<br/>trimestre</p>
              </div>
            </div>
            
            ${showCentralizadorAndBoletines ? `
            <!-- Centralizador -->
            <div class="report-option" data-value="centralizador" style="display: flex; flex-direction: column; align-items: center; padding: 20px 16px; border: 2px solid #059669; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; background: #065F46; text-align: center;">
              <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #10B981; border-radius: 50%; margin-bottom: 12px;">
                <svg style="width: 24px; height: 24px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"></path>
                </svg>
              </div>
              <div>
                <h3 style="color: white; font-weight: 600; margin: 0 0 4px 0; font-size: 16px;">Centralizador</h3>
                <p style="color: #6EE7B7; font-size: 12px; margin: 0;">Excel anual<br/>completo</p>
              </div>
            </div>
            
            <!-- Boletines -->
            <div class="report-option" data-value="boletines" style="display: flex; flex-direction: column; align-items: center; padding: 20px 16px; border: 2px solid #7C3AED; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; background: #581C87; text-align: center;">
              <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #8B5CF6; border-radius: 50%; margin-bottom: 12px;">
                <svg style="width: 24px; height: 24px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div>
                <h3 style="color: white; font-weight: 600; margin: 0 0 4px 0; font-size: 16px;">Boletines</h3>
                <p style="color: #C4B5FD; font-size: 12px; margin: 0;">PDFs<br/>individuales</p>
              </div>
            </div>
            ` : ''}
          </div>
        </div>
      `,
      background: '#1F2937',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      showConfirmButton: false,
      buttonsStyling: false,
      width: showCentralizadorAndBoletines ? '600px' : '300px',
      customClass: {
        popup: 'swal2-dark-popup',
        cancelButton: 'swal2-dark-cancel-button',
        title: 'swal2-dark-title'
      },
      didOpen: () => {
        // Añadir estilos CSS dinámicamente
        const style = document.createElement('style');
        style.textContent = `
          .swal2-dark-popup {
            background-color: #1F2937 !important;
            border: 1px solid #374151 !important;
          }
          .swal2-dark-title {
            color: #E5E7EB !important;
          }
          .swal2-dark-cancel-button {
            background-color: #4B5563 !important;
            color: #E5E7EB !important;
            border: none !important;
            padding: 12px 24px !important;
            border-radius: 8px !important;
            font-weight: 500 !important;
            transition: background-color 0.3s ease !important;
          }
          .swal2-dark-cancel-button:hover {
            background-color: #6B7280 !important;
          }
          .report-option:hover {
            transform: scale(1.05) !important;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
          }
        `;
        document.head.appendChild(style);

        const reportOptions = document.querySelectorAll('.report-option');
        reportOptions.forEach(option => {
          option.addEventListener('click', () => {
            const value = option.getAttribute('data-value');
            Swal.clickConfirm();
            Swal.getPopup().setAttribute('data-return-value', value);
          });
        });
      },
      preConfirm: () => {
        const popup = Swal.getPopup();
        return popup.getAttribute('data-return-value');
      }
    });

    if (!reportType) return; // Si el usuario cancela

    // Manejar cada tipo de reporte
    if (reportType === 'informe-trimestral') {
      await handleInformeTrimestral(curso);
    } else if (reportType === 'centralizador' && showCentralizadorAndBoletines) {
      await handleCentralizador(curso);
    } else if (reportType === 'boletines' && showCentralizadorAndBoletines) {
      await handleBoletines(curso);
    }
  };

  // Manejar informe trimestral (funcionalidad actual)
  const handleInformeTrimestral = async (curso: any) => {
    const { value: quarter } = await Swal.fire({
      title: 'Seleccionar Trimestre',
      input: 'select',
      inputOptions: {
        '1': 'Primer Trimestre',
        '2': 'Segundo Trimestre',
        '3': 'Tercer Trimestre'
      },
      inputPlaceholder: 'Selecciona un trimestre',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Descargar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes seleccionar un trimestre';
        }
      }
    });

    if (!quarter) return; // Si el usuario cancela

    Swal.fire({
      title: "Generando reporte...",
      text: `Preparando reporte del ${quarter}° trimestre`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await getTasksReportByCourse(
        curso.courseId.toString(),
        professor.id.toString(),
        selectedManagement.toString(),
        quarter
      );

      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Reporte Descargado",
        text: `El reporte del ${quarter}° trimestre para el curso ${curso.course} ${curso.parallel} se está descargando`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al generar el reporte:', error);
      Swal.close();
      Swal.fire("Error", "No se pudo generar el reporte. Por favor, intente nuevamente.", "error");
    }
  };

  // Manejar centralizador
  const handleCentralizador = async (curso: any) => {
    if (!selectedManagement) {
      Swal.fire("Error", "No se pudo obtener la información de gestión necesaria", "error");
      return;
    }

    Swal.fire({
      title: "Generando centralizador...",
      text: `Preparando Excel anual completo para ${curso.course} ${curso.parallel}`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await getCentralizadorReport(
        curso.courseId.toString(),
        selectedManagement.toString()
      );

      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Centralizador Descargado",
        text: `El centralizador para el curso ${curso.course} ${curso.parallel} se está descargando`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al generar el centralizador:', error);
      Swal.close();
      Swal.fire("Error", "No se pudo generar el centralizador. Por favor, intente nuevamente.", "error");
    }
  };

  // Manejar boletines
  const handleBoletines = async (curso: any) => {
    if (!selectedManagement) {
      Swal.fire("Error", "No se pudo obtener la información de gestión necesaria", "error");
      return;
    }

    Swal.fire({
      title: "Generando boletines...",
      text: `Preparando PDFs individuales para ${curso.course} ${curso.parallel}`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await getBoletinesReport(
        curso.courseId.toString(),
        selectedManagement.toString()
      );

      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Boletines Descargados",
        text: `Los boletines para el curso ${curso.course} ${curso.parallel} se están descargando`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al generar los boletines:', error);
      Swal.close();
      Swal.fire("Error", "No se pudo generar los boletines. Por favor, intente nuevamente.", "error");
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
                    Reportes
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