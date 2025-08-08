'use client';
import { useEffect, useState, useCallback } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Swal from 'sweetalert2';
import Breadcrumb from '../../../components/Common/Breadcrumb';
import RegistrationModal from '../../../components/Registration/RegistrationModal';
import { getProfesores, getAsignacionesByCurso, updateAsignacion, createAsignacion } from '../../../utils/asignationService';
import { getCourseById, getMaterias } from '../../../utils/courseService';
import { getCurrentManagementData, isCurrentManagementActive } from '../../../utils/globalState';

type Professor = {
  id: number;
  is_tecnical: number;
  subjects: string;
  status: number;
  person: {
    name: string;
    lastname: string;
    second_lastname: string;
    full_name: string;
  };
};

type Subject = {
  id: number;
  subject: string;
  is_tecnical: number;
  status?: number;
};

type Curriculum = {
  id: number;
  subject_id: number;
  subject: Subject;
};

type Assignment = {
  id: number;
  subject_id: number;
  professor_id: number;
};

type Course = {
  id: number;
  parallel: string;
  course: string;
  degree: {
    id: number;
    degree: string;
  };
  management: {
    id: number;
    management: number;
  };
  curriculums: Curriculum[];
};

const CourseDetails = ({ params }: { params: { courseId: number } }) => {
  const { courseId } = params;
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [existingAssignments, setExistingAssignments] = useState<Assignment[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [courseData, professorsData, assignmentsData, subjectsData] = await Promise.all([
        getCourseById(courseId),
        getProfesores(),
        getAsignacionesByCurso(courseId),
        getMaterias()
      ]);

      setCourse(courseData);
      setSubjects(subjectsData);

      const formattedProfessors = professorsData.professors
        .filter((prof: Professor) => prof.status === 1)
        .map((prof: Professor) => ({
          ...prof,
          person: {
            ...prof.person,
            full_name: `${prof.person.name} ${prof.person.lastname} ${prof.person.second_lastname}`.trim()
          }
        }));
      
      setProfessors(formattedProfessors);
      setExistingAssignments(assignmentsData);
      setAssignments(assignmentsData);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDrop = (subjectId: number, professorId: number) => {
    const professor = professors.find(p => p.id === professorId);
    const subject = subjects.find(s => s.id === subjectId);
    
    if (!professor || !subject) return;

    if (professor.is_tecnical === 1 && subject.is_tecnical === 0) {
      Swal.fire('Advertencia', 'Este profesor no está calificado para materias regulares.', 'error');
      return;
    }

    if (professor.is_tecnical === 0 && subject.is_tecnical === 1) {
      Swal.fire('Advertencia', 'Este profesor no está calificado para materias técnicas.', 'error');
      return;
    }

    if (professor.is_tecnical === 0 && subject.is_tecnical === 0) {
      const regularSubjects = course?.curriculums
        .map(c => subjects.find(s => s.id === c.subject_id))
        .filter(s => s && s.is_tecnical === 0) as Subject[];
    
      setAssignments(prev => {
        const updated = [...prev];
        regularSubjects.forEach(subjectItem => {
          const index = updated.findIndex(a => a.subject_id === subjectItem.id);
          if (index >= 0) {
            updated[index] = { ...updated[index], professor_id: professor.id };
          } else {
            updated.push({
              id: 0,
              subject_id: subjectItem.id,
              professor_id: professor.id,
            });
          }
        });
        return updated;
      });
    
      return;
    }

    setAssignments(prev => {
      const existingIndex = prev.findIndex(a => a.subject_id === subjectId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          professor_id: professor.id
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: 0, 
            subject_id: subject.id,
            professor_id: professor.id,
          }
        ];
      }
    });
  };

  const saveAssignments = async () => {
    const allSubjectsAssigned = course?.curriculums.every(curriculum => 
      assignments.some(a => a.subject_id === curriculum.subject_id)
    );
  
    /*if (!allSubjectsAssigned) {
      Swal.fire('Error', 'Debes asignar un profesor a todas las materias antes de guardar.', 'error');
      return;
    }*/
    try {
      const isUpdate = existingAssignments.length > 0;
  
      if (isUpdate) {
        // Prepare updates for existing assignments
        const updates = assignments
          .filter(newAssignment => {
            const oldAssignment = existingAssignments.find(
              a => a.subject_id === newAssignment.subject_id
            );
            return oldAssignment && oldAssignment.professor_id !== newAssignment.professor_id;
          })
          .map(changedAssignment => ({
            assignmentId: changedAssignment.id,
            newProfessorId: changedAssignment.professor_id
          }));
  
        if (updates.length === 0) {
          Swal.fire('Info', 'No hay cambios para guardar', 'info');
          return;
        }
  
        await updateAsignacion(updates);
        Swal.fire('Éxito', 'Asignaciones actualizadas con éxito', 'success');
      } else {

        // Create new assignments
        const newAssignments = assignments.map(assignment => ({
          subject_id: assignment.subject_id,
          professor_id: assignment.professor_id,
          course_id: Number(courseId),
          management_id: course?.management.id,
        }));
        console.log('New Assignments:', newAssignments);
        await createAsignacion(newAssignments);
        Swal.fire('Éxito', 'Asignaciones creadas con éxito', 'success');
      }
  
      loadData();
    } catch (error) {
      console.error('Error saving assignments:', error);
      Swal.fire('Error', 'Hubo un error al guardar las asignaciones', 'error');
    }
  };

  const getAssignedProfessor = (subjectId: number) => {
    const assignment = assignments.find(a => a.subject_id === subjectId);
    if (!assignment) return null;
    
    const professor = professors.find(p => p.id === assignment.professor_id);
    return professor ? {
      id: professor.id,
      full_name: professor.person.full_name,
      is_tecnical: professor.is_tecnical
    } : null;
  };

  const getFilteredProfessors = (isTechnical: number) => {
    return professors.filter(prof => prof.is_tecnical === isTechnical);
  };

  return (
    <>
      <Breadcrumb
        pageName="Asignaciones e Inscripciones"
        description="Arrastra y suelta docentes a las materias para asignarlos."
      />
      
      <DndProvider backend={HTML5Backend}>
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Inscripción de Estudiantes</h3>
            <button 
              onClick={() => setShowRegistrationModal(true)} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Inscripción
            </button>
          </div>
          
          {loading ? (
            <p className="text-center text-gray-500">Cargando detalles del curso...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : course ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{course.course}</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Grado: {course.degree.degree} • Gestión: {course.management.management}
                </p>
              </div>
              
              <div className="flex space-x-10">
              <div className="w-2/3">
                <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Materias</h3>
                
                {/* Materias Regulares */}
                <div className="mb-3">
                  <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Materias Regulares</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.curriculums
                      .filter(curriculum => {
                        const subject = subjects.find(s => s.id === curriculum.subject_id);
                        return subject?.is_tecnical === 0;
                      })
                      .map(curriculum => {
                        const subject = subjects.find(s => s.id === curriculum.subject_id);
                        return subject ? (
                          <SubjectItem
                            key={curriculum.id}
                            subject={subject}
                            professor={getAssignedProfessor(subject.id)}
                            onDrop={handleDrop}
                          />
                        ) : null;
                      })}
                  </div>
                </div>
                
                {/* Materias Técnicas */}
                <div>
                  <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Materias Técnicas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.curriculums
                      .filter(curriculum => {
                        const subject = subjects.find(s => s.id === curriculum.subject_id);
                        return subject?.is_tecnical === 1;
                      })
                      .map(curriculum => {
                        const subject = subjects.find(s => s.id === curriculum.subject_id);
                        return subject ? (
                          <SubjectItem
                            key={curriculum.id}
                            subject={subject}
                            professor={getAssignedProfessor(subject.id)}
                            onDrop={handleDrop}
                          />
                        ) : null;
                      })}
                  </div>
                </div>
              </div>
                
                <div className="w-1/3">
                  <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Docentes</h3>
                  
                  <div className="mb-8">
                    <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Profesores Regulares</h4>
                    <div className="bg-white dark:bg-gray-800 p-5 rounded shadow-lg border border-gray-200 dark:border-gray-600">
                      {getFilteredProfessors(0).map(professor => (
                        <ProfessorItem key={professor.id} professor={professor} />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Profesores Técnicos</h4>
                    <div className="bg-white dark:bg-gray-800 p-5 rounded shadow-lg border border-gray-200 dark:border-gray-600">
                      {getFilteredProfessors(1).map(professor => (
                        <ProfessorItem key={professor.id} professor={professor} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {isCurrentManagementActive() && (
                <button
                  onClick={saveAssignments}
                  className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar asignaciones'}
                </button>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500">No se encontraron detalles para este curso.</p>
          )}
        </div>
      </DndProvider>
      
      <RegistrationModal 
        show={showRegistrationModal} 
        onClose={() => setShowRegistrationModal(false)} 
        courseId={courseId}
      />
    </>
  );
};

const ProfessorItem = ({ professor }: { professor: Professor }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'PROFESSOR',
    item: { professorId: professor.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [professor.id]);

  return (
    <div
      ref={drag as unknown as React.LegacyRef<HTMLDivElement>}
      className={`p-3 rounded mb-3 shadow cursor-pointer ${
        professor.is_tecnical === 1 
          ? 'bg-purple-500 dark:bg-purple-600' 
          : 'bg-indigo-500 dark:bg-indigo-600'
      } text-white ${isDragging ? 'opacity-50' : ''}`}
    >
      {professor.person.full_name}
      <div className="text-xs opacity-80">
        {professor.subjects}
      </div>
    </div>
  );
};

const SubjectItem = ({
  subject,
  professor,
  onDrop,
}: {
  subject: Subject;
  professor: { id: number; full_name: string } | null;
  onDrop: (subjectId: number, professorId: number) => void;
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'PROFESSOR',
    drop: (item: { professorId: number }) => onDrop(subject.id, item.professorId),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [subject.id]);

  return (
    <div
      ref={drop as unknown as React.LegacyRef<HTMLDivElement>}
      className={`p-5 rounded shadow-lg border ${
        subject.is_tecnical === 1 
          ? 'border-purple-200 dark:border-purple-600' 
          : 'border-gray-200 dark:border-indigo-600'
      } ${isOver ? 'border-blue-500 dark:border-blue-400' : ''} bg-white dark:bg-gray-800`}
      
    >
      <h4 className="font-bold text-gray-700 dark:text-white mb-2">
        {subject.subject}
      </h4>
      <p className="text-sm text-gray-500 dark:text-gray-300">
        {professor ? `Asignado a: ${professor.full_name}` : 'Sin asignar'}
      </p>
    </div>
  );
};

export default CourseDetails;