'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getActivityByIdWithAssignments, updateTaskGrades, getTaskByIdWithAssignmentsForStudent } from '../../../../../../utils/tasksService';
import EvaluationToolViewer from '../../../../../../components/Task/Evaluation/EvaluationToolViewer'
import Swal from 'sweetalert2';

export default function GradeTaskPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams?.get('courseId');
  const [task, setTask] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [changeCount, setChangeCount] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewStudentId, setReviewStudentId] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewStudentName, setReviewStudentName] = useState('');

  useEffect(() => {
    const loadTask = async () => {
      setIsLoading(true);
      try {
        const response = await getActivityByIdWithAssignments(params.taskId);
        console.log('Evaluation methodology structure:', response);
        setTask(response.task);
        if (response.task && response.task.assignments) {
          setStudents(response.task.assignments.map(a => ({
            id: a.student_id,
            nombre: `${a.student.person.name} ${a.student.person.lastname} ${a.student.person.second_lastname || ''}`,
            calificacion: (a.qualification || '').trim(),
            comentario: a.comment || '',
            status: a.status,
            evaluationTool: {
              type: a.type,  
              methodology: a.evaluation_methodology  
            },
            evaluation_methodology: a.evaluation_methodology
          })));
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la tarea.' });
      } finally {
        setIsLoading(false);
      }
    };
    loadTask();
  }, [params.taskId]);

  const handleGradeChange = useCallback((index, newGrade) => {
    setStudents(prev => {
      const updated = [...prev];
      updated[index].calificacion = newGrade.trim();
      return updated;
    });
    setChangeCount(c => c + 1);
  }, []);

  const handleCommentChange = useCallback((index, newComment) => {
    setStudents(prev => {
      const updated = [...prev];
      updated[index].comentario = newComment;
      return updated;
    });
    setChangeCount(c => c + 1);
  }, []);

  // Nueva función para manejar cambios en evaluation_methodology
  const handleEvaluationMethodologyChange = useCallback((studentIndex, updatedMethodology) => {
    setStudents(prev => {
      const updated = [...prev];
      updated[studentIndex].evaluation_methodology = updatedMethodology;
      return updated;
    });
    setChangeCount(c => c + 1);
  }, []);

  const saveGrades = async () => {
    setIsSaving(true);
    try {
      const studentsData = students.map(s => ({
        student_id: s.id,
        qualification: s.calificacion,
        comment: s.comentario || '',
        evaluation_methodology: s.evaluation_methodology 
      }));
      console.log('Enviando a backend:', studentsData);
      const response = await updateTaskGrades(params.taskId, studentsData);
      if (!response.ok) throw new Error('Error al guardar');
      setChangeCount(0);
      Swal.fire({ icon: 'success', title: 'Éxito', text: 'Calificaciones actualizadas correctamente', timer: 1800, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron guardar las calificaciones.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Estado visual de cada estudiante
  const getStudentStatus = (status) => {
    switch (status) {
      case 2: return { color: 'bg-purple-500', text: 'Evaluada' };
      case 1: return { color: 'bg-green-500', text: 'Entregada' };
      default: return { color: 'bg-yellow-500', text: 'Pendiente' };
    }
  };

  // Abrir modal y cargar datos de entrega
  const handleOpenReview = async (studentId) => {
    setReviewStudentId(studentId);
    const studentObj = students.find(s => s.id === studentId);
    setReviewStudentName(studentObj ? studentObj.nombre : '');
    setShowReviewModal(true);
    setReviewLoading(true);
    try {
      const taskId = Array.isArray(params.taskId) ? params.taskId[0] : params.taskId;
      const studentIdStr = Array.isArray(studentId) ? studentId[0] : studentId;
      const data = await getTaskByIdWithAssignmentsForStudent(taskId, studentIdStr);
      console.log('DATA DE BACKEND (reviewData):', data.data);
      setReviewData(data.data);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la entrega del estudiante.' });
      setShowReviewModal(false);
    } finally {
      setReviewLoading(false);
    }
  };

  // Guardar calificación desde el modal
  const handleSaveReview = async () => {
    if (!reviewData) return;
    setReviewSaving(true);
    try {
      const assignment = reviewData.assignments?.[0];
      const studentsData = [{
        student_id: assignment.student_id,
        qualification: assignment.qualification,
        comment: assignment.comment || '',
        evaluation_methodology: assignment.evaluation_methodology // Incluir evaluation_methodology actualizado
      }];
      console.log('Enviando a backend:', studentsData);
      const response = await updateTaskGrades(params.taskId, studentsData);
      if (!response.ok) throw new Error('Error al guardar');
      
      // Actualizar el estado local de students con los nuevos datos
      setStudents(prev => prev.map(student => {
        if (student.id === assignment.student_id) {
          return {
            ...student,
            calificacion: assignment.qualification,
            comentario: assignment.comment || '',
            evaluation_methodology: assignment.evaluation_methodology
          };
        }
        return student;
      }));
      
      setChangeCount(0);
      Swal.fire({ icon: 'success', title: 'Éxito', text: 'Calificación actualizada correctamente', timer: 1800, showConfirmButton: false });
      setShowReviewModal(false);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la calificación.' });
    } finally {
      setReviewSaving(false);
    }
  };

  // Manejar cambios en el modal de revisión
  const handleReviewEvaluationChange = useCallback((updatedMethodology) => {
    setReviewData(prev => ({
      ...prev,
      assignments: [{
        ...prev.assignments[0],
        evaluation_methodology: updatedMethodology
      }]
    }));
  }, []);

  const handleReviewScoreChange = useCallback((score) => {
    setReviewData(prev => ({
      ...prev,
      assignments: [{
        ...prev.assignments[0],
        qualification: String(score)
      }]
    }));
  }, []);

  if (isLoading) {
    return <div className="flex flex-col items-center justify-center min-h-[40vh] py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div><p className="text-lg text-gray-600">Cargando tarea...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 lg:pt-[150px]">
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 mt-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Calificar Tarea</h1>
        {task && (
          <div className="mb-6">
            <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">{task.name}</div>
            <div className="text-gray-500 dark:text-gray-400 mb-2">{task.description}</div>
            <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Área: {task.dimension?.dimension}</span>
              <span>Ponderación: {task.weight}%</span>
              <span>Entrega: {task.end_date ? new Date(task.end_date).toLocaleDateString() : ''}</span>
            </div>
          </div>
        )}
        {task && task.type !== 0 && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={saveGrades}
              disabled={isSaving || changeCount === 0}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isSaving ? 'Guardando...' : 'Guardar Calificaciones'}
            </button>
          </div>
        )}
        <div className="space-y-4">
          {task && task.type === 0 ? (
            students.map((student, idx) => {
              const status = getStudentStatus(student.status);
              return (
                <div key={student.id} className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border ${status.color} bg-gray-50 dark:bg-gray-900`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${status.color}`}></span>
                      <span className="font-semibold text-gray-900 dark:text-white">{student.nombre}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${status.color} text-white`}>{status.text}</span>
                    </div>
                  </div>
                  <button
                    className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold transition"
                    title="Revisar entrega"
                    onClick={() => handleOpenReview(student.id)}
                  >
                    Revisar Entrega
                  </button>
                </div>
              );
            })
          ) : (
            students.map((student, idx) => {
              const status = getStudentStatus(student.status);
              return (
                <div key={student.id} className={`flex flex-col md:flex-row md:items-center gap-2 p-4 rounded-lg border ${status.color} bg-gray-50 dark:bg-gray-900 w-full max-w-7xl mx-auto`}>
                  <div className="flex flex-col md:flex-row md:items-center w-full gap-2">
                    <div className="flex items-center gap-2 min-w-[300px]">
                      <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[300px]">{student.nombre}</span>
                    </div>
                    <input
                      type="number"
                      className="w-20 px-2 py-1 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-center"
                      placeholder="Nota"
                      value={student.calificacion}
                      min={0}
                      max={100}
                      onChange={e => {
                        let value = e.target.value;
                        // Permitir vacío para borrar
                        if (value === "") {
                          handleGradeChange(idx, "");
                          return;
                        }
                        // Solo permitir números entre 0 y 100
                        const num = Number(value);
                        if (!isNaN(num) && num >= 0 && num <= 100) {
                          handleGradeChange(idx, value);
                        }
                      }}
                      maxLength={5}
                    />
                    <input
                      type="text"
                      className="flex-1 px-2 py-1 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      placeholder="Comentario"
                      value={student.comentario || ''}
                      onChange={e => {
                        if (e.target.value.length <= 300) {
                          handleCommentChange(idx, e.target.value);
                        }
                      }}
                      maxLength={300}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* MODAL DE REVISAR ENTREGA */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col relative animate-fadeIn">
            {/* Header fijo */}
            <div className="p-6 pb-0 sticky top-0 bg-white dark:bg-gray-800 z-10 border-b dark:border-gray-700">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Entrega de {reviewStudentName}
                </h2>
                <button 
                  className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
                  onClick={() => setShowReviewModal(false)}
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>

            {/* Contenido con scroll */}
            <div className="overflow-y-auto flex-1 p-6">
              {reviewLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-lg text-gray-600">Cargando entrega...</p>
                </div>
              ) : reviewData && reviewData.assignments && reviewData.assignments[0] ? (
                <>
                  <div className="mb-4 text-gray-500 dark:text-gray-400">
                    {reviewData.description}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <span className="font-semibold">Fecha límite:</span> 
                      {reviewData.end_date ? new Date(reviewData.end_date).toLocaleDateString() : 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Ponderación:</span> {reviewData.weight}%
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="font-semibold">Estado: </span>
                    {reviewData.assignments[0].status === 2 ? (
                      <span className="text-purple-600 font-semibold">Evaluada</span>
                    ) : reviewData.assignments[0].status === 1 ? (
                      <span className="text-green-600 font-semibold">Entregada</span>
                    ) : (
                      <span className="text-red-600 font-semibold">No entregada</span>
                    )}
                  </div>

                  {/* Archivos entregados */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 text-lg">Archivos entregados</h3>
                    {reviewData.assignments[0].files && reviewData.assignments[0].files.length > 0 ? (
                      <ul className="space-y-3 bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
                        {reviewData.assignments[0].files.map((file, idx) => (
                          <li key={file.url} className="flex items-center gap-3">
                            <a 
                              href={file.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:underline flex items-center gap-2"
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-5 w-5" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                                />
                              </svg>
                              <span className="truncate max-w-xs">{file.name || 'Archivo'}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500 italic bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
                        No hay archivos entregados
                      </div>
                    )}
                  </div>

                  {/* Evaluación */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 text-lg">Evaluación</h3>
                    {reviewData.assignments[0] && reviewData.assignments[0].evaluation_methodology ? (
                      <EvaluationToolViewer
                        methodology={{
                          type: reviewData.assignments[0].type,
                          methodology: reviewData.assignments[0].evaluation_methodology
                        }}
                        onScoreChange={handleReviewScoreChange}
                        onEvaluationChange={handleReviewEvaluationChange}
                      />
                    ) : (
                      <div className="text-gray-500 italic">
                        No hay herramienta de evaluación definida
                      </div>
                    )}
                  </div>

                  {/* Nota y comentario */}
                  <div className="space-y-6">
                    <div>
                      <label className="block font-semibold mb-2">Nota Final</label>
                      <input
                        type="number"
                        className="w-24 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white text-center"
                        value={
                          reviewData.assignments[0].qualification && reviewData.assignments[0].qualification.trim() !== ""
                            ? Number(reviewData.assignments[0].qualification.trim())
                            : ""
                        }
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-2">Comentario</label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white min-h-[100px]"
                        placeholder="Escribe tus comentarios aquí..."
                        value={reviewData.assignments[0].comment || ''}
                        onChange={e => {
                          if (e.target.value.length <= 300) {
                            setReviewData(prev => ({ 
                              ...prev, 
                              assignments: [{ 
                                ...prev.assignments[0], 
                                comment: e.target.value 
                              }] 
                            }));
                          }
                        }}
                        maxLength={300}
                      />
                      <div className="text-right text-sm text-gray-500 mt-1">
                        {reviewData.assignments[0].comment?.length || 0}/300 caracteres
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-10">
                  No se encontró información de la entrega
                </div>
              )}
            </div>

            {/* Footer fijo */}
            <div className="p-6 sticky bottom-0 bg-white dark:bg-gray-800 z-10 border-t dark:border-gray-700 flex justify-end">
              <button
                onClick={handleSaveReview}
                disabled={reviewSaving}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {reviewSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  'Guardar Calificación'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}