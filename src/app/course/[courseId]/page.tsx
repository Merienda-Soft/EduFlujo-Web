// app/course/[courseId]/page.tsx
'use client';
import { httpRequestFactory } from '../../../utils/HttpRequestFactory';
import { useEffect, useState, useRef } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Swal from 'sweetalert2';
import Breadcrumb from '../../../components/Common/Breadcrumb';
import RegistrationModal from '../../../components/Registration/RegistrationModal';
import { getProfesores, createAsignacion, updateAsignacion } from '../../../utils/asignationService';

type Materia = {
  _id: string;
  name: string;
};

type Profesor = {
  _id: string;
  name: string;
};

type Asignacion = {
  _id: string;
  curso: string;
  professor: { _id: string };
  materias: { _id: string }[];
};

type DragItem = {
  profesorId: string;
};

const CourseDetails = ({ params }: { params: { courseId: string } }) => {
  const { courseId } = params;
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [course, setCourse] = useState<{ name: string; materias: Materia[] } | null>(null);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [asignaciones, setAsignaciones] = useState<{ [key: string]: string }>({}); 
  const [existingAsignaciones, setExistingAsignaciones] = useState<Asignacion[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener datos del curso
        const { url: courseUrl, config: courseConfig } = httpRequestFactory.createRequest(`/courses/${courseId}`);
        const courseResponse = await fetch(courseUrl, courseConfig);
        if (!courseResponse.ok) throw new Error('Error al cargar el curso');
        const courseData = await courseResponse.json();
        setCourse(courseData);

        const profesoresData = await getProfesores();
        setProfesores(profesoresData);

        const { url: asignacionesUrl, config: asignacionesConfig } = httpRequestFactory.createRequest(`/asignaciones/curso/${courseId}`);
        const asignacionesResponse = await fetch(asignacionesUrl, asignacionesConfig);
        if (!asignacionesResponse.ok) throw new Error('Error al cargar asignaciones');
        const asignacionesData = await asignacionesResponse.json();

        setExistingAsignaciones(asignacionesData);

        const initialAsignaciones = asignacionesData.reduce((acc, asignacion) => {
          const profesorId = asignacion.professor._id;
          asignacion.materias.forEach((materia) => {
            acc[materia._id] = profesorId;
          });
          return acc;
        }, {} as { [key: string]: string });

        setAsignaciones(initialAsignaciones);
      } catch (err) {
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleDrop = (materiaId: string, profesorId: string) => {
    setAsignaciones((prev) => ({
      ...prev,
      [materiaId]: profesorId,
    }));
  };

  const guardarAsignaciones = async () => {
    try {
      const agrupacionAsignaciones = profesores.reduce((acc, profesor) => {
        acc[profesor._id] = Object.entries(asignaciones)
          .filter(([, idProfesor]) => idProfesor === profesor._id)
          .map(([idMateria]) => idMateria);
        return acc;
      }, {} as { [profesorId: string]: string[] });

      const requests = Object.entries(agrupacionAsignaciones).map(async ([profesorId, materias]) => {
        const existingAsignacion = existingAsignaciones.find(
          (asignacion) => asignacion.professor._id === profesorId
        );

        const asignacionData = {
          curso: courseId,
          professor: profesorId,
          materias, 
        };

        if (existingAsignacion) {
          return updateAsignacion(existingAsignacion._id, asignacionData);
        } else {
          return createAsignacion(asignacionData);
        }
      });

      await Promise.all(requests);
      Swal.fire('Éxito', 'Asignaciones guardadas con éxito', 'success');
    } catch (error) {
      console.error('Error al guardar las asignaciones:', error);
      Swal.fire('Error', 'Hubo un error al guardar las asignaciones.', 'error');
    }
  };

  return (
    <>
      <Breadcrumb
        pageName="Asignaciones e Inscripciones"
        description="Arrastra y suelta docentes a las materias para asignarlos."
      />
      {/* Div de Inscripción de Estudiantes */}
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
              <div className="flex space-x-10">
                <div className="w-2/3">
                  <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Materias</h3>
                  {course.materias.map((materia) => (
                    <MateriaItem
                      key={materia._id}
                      materia={materia}
                      profesorAsignado={profesores.find((p) => p._id === asignaciones[materia._id])}
                      onDrop={(profesorId) => handleDrop(materia._id, profesorId)}
                    />
                  ))}
                </div>
                <div className="w-1/3">
                  <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Docentes</h3>
                  <div className="bg-white dark:bg-gray-800 p-5 rounded shadow-lg border border-gray-200 dark:border-gray-600">
                    {profesores.map((profesor) => (
                      <ProfesorItem key={profesor._id} profesor={profesor} />
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={guardarAsignaciones}
                className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Guardar asignaciones
              </button>
            </>
          ) : (
            <p className="text-center text-gray-500">No se encontraron detalles para este curso.</p>
          )}
          {/* Modal de Registro */}
        </div>
      </DndProvider>
      <RegistrationModal show={showRegistrationModal} onClose={() => setShowRegistrationModal(false)} courseId={courseId}/>
    </>
  );
};

export default CourseDetails;

const ProfesorItem = ({ profesor }: { profesor: Profesor }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'PROFESOR',
    item: { profesorId: profesor._id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [profesor._id]);

  drag(ref);

  return (
    <div
      ref={ref}
      className={`bg-indigo-500 dark:bg-indigo-600 text-white p-3 rounded mb-3 shadow cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {profesor.name}
    </div>
  );
};

const MateriaItem = ({
  materia,
  profesorAsignado,
  onDrop,
}: {
  materia: Materia;
  profesorAsignado?: Profesor;
  onDrop: (profesorId: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'PROFESOR',
    drop: (item: DragItem) => onDrop(item.profesorId),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [materia._id]);

  drop(ref);

  return (
    <div
      ref={ref}
      className={`bg-white dark:bg-gray-800 p-5 rounded mb-4 shadow-lg border border-gray-200 dark:border-gray-600 ${
        isOver ? 'border-blue-500 dark:border-blue-400' : ''
      }`}
    >
      <h4 className="font-bold text-gray-700 dark:text-white mb-2">{materia.name}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-300">
        {profesorAsignado ? `Asignado a: ${profesorAsignado.name}` : 'Sin asignar'}
      </p>
    </div>
  );
};
