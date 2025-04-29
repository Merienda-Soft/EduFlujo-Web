'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faSyncAlt, faIdCard, faEnvelope, faImage, faUser, faUsers, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { getTutorShipByStatus, updateTutor } from '../../../utils/tutorshipService';
import Swal from 'sweetalert2';
import Breadcrumb from '../../../components/Common/Breadcrumb';

interface Tutor {
  id: number;
  status: number;
  url_imagefront: string;
  url_imageback: string;
  person: {
    name: string;
    lastname: string;
    second_lastname: string;
    ci: string;
    email: string;
  };
  students: {
    tutor_id: number;
    student_id: number;
    relacion: string;
    createdAt: string;
    student: {
      id: number;
      matricula: string;
      rude: string;
      person: {
        name: string;
        lastname: string;
        second_lastname: string;
        ci: string;
      };
    };
  }[];
}

const TutorControl = () => {
  const params = useParams();
  const status = params?.status as string;
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const statusNumber = Number(status);
    if (isNaN(statusNumber)) {
      setLoading(false);
      return;
    }

    const fetchTutors = async () => {
      setLoading(true);
      try {
        const data = await getTutorShipByStatus(statusNumber);
        setTutors(data);
      } catch (error) {
        console.error('Error fetching tutors:', error);
        Swal.fire('Error', 'No se pudo cargar la lista de tutores', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, [status]);

  const handleStatusUpdate = async (tutorId: number, newStatus: number) => {
    try {
      await updateTutor({ tutorId, status: newStatus });
      Swal.fire('Éxito', 'Estado del tutor actualizado correctamente', 'success');
      const data = await getTutorShipByStatus(Number(status));
      setTutors(data);
    } catch (error) {
      console.error('Error updating tutor status:', error);
      Swal.fire('Error', 'No se pudo actualizar el estado del tutor', 'error');
    }
  };

  const openModal = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTutor(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb
        pageName={
          status === '1' ? 'Tutores Aceptados' : 
          status === '2' ? 'Solicitudes Pendientes' : 
          'Tutores Rechazados'
        }
        description="Gestión de tutores según su estado de aprobación"
      />

      <div className="container mx-auto px-4 py-8">
        {tutors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300">
              No hay tutores en este estado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map((tutor) => (
              <div
                key={tutor.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300 flex flex-col"
              >
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {tutor.person.name} {tutor.person.lastname} {tutor.person.second_lastname}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Solicitante</p>
                    </div>
                    <button
                      onClick={() => openModal(tutor)}
                      className="text-primary dark:text-primary-dark hover:text-primary-dark dark:hover:text-primary transition text-sm flex items-center"
                      title="Ver detalles"
                    >
                      <FontAwesomeIcon icon={faFileAlt} className="mr-1" />
                      <span>Detalles</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-sm" />
                      <span className="text-sm">{tutor.person.email}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <FontAwesomeIcon icon={faIdCard} className="mr-2 text-sm" />
                      <span className="text-sm">{tutor.person.ci}</span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center text-gray-700 dark:text-gray-300 mb-2">
                        <FontAwesomeIcon icon={faUsers} className="mr-2" />
                        <h3 className="font-medium">Estudiantes implicados</h3>
                      </div>
                      <ul className="space-y-2">
                        {tutor.students.map((student, index) => (
                          <li key={index} className="text-gray-800 dark:text-white text-sm">
                            <span className="font-medium">{student.relacion}:</span> {student.student.person.name} {student.student.person.lastname} {student.student.person.second_lastname}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Acciones según el estado */}
                <div className="px-6 pb-4 mt-auto">
                  {status === '2' && (
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleStatusUpdate(tutor.id, 1)}
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 py-1 px-3 rounded flex items-center space-x-1 transition text-sm"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                        <span>Aceptar</span>
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(tutor.id, 0)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 py-1 px-3 rounded flex items-center space-x-1 transition text-sm"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  )}
                  {status === '0' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleStatusUpdate(tutor.id, 2)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 py-1 px-3 rounded flex items-center space-x-1 transition text-sm"
                      >
                        <FontAwesomeIcon icon={faSyncAlt} />
                        <span>Reactivar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal para detalles */}
        {showModal && selectedTutor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    Detalles completos del tutor
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                  >
                    &times;
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3 text-lg flex items-center">
                    <FontAwesomeIcon icon={faImage} className="mr-2" />
                    Documentos de identidad
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm">Anverso de CI</p>
                      <img
                        src={selectedTutor.url_imagefront}
                        alt="Anverso de carnet"
                        className="w-full h-48 object-contain rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm">Reverso de CI</p>
                      <img
                        src={selectedTutor.url_imageback}
                        alt="Reverso de carnet"
                        className="w-full h-48 object-contain rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3 text-lg flex items-center">
                      <FontAwesomeIcon icon={faUser} className="mr-2" />
                      Información del solicitante
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Nombre completo</p>
                        <p className="text-gray-800 dark:text-white">
                          {selectedTutor.person.name} {selectedTutor.person.lastname} {selectedTutor.person.second_lastname}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Carnet de identidad</p>
                        <p className="text-gray-800 dark:text-white">{selectedTutor.person.ci}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Correo electrónico</p>
                        <p className="text-gray-800 dark:text-white">{selectedTutor.person.email}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3 text-lg flex items-center">
                      <FontAwesomeIcon icon={faUsers} className="mr-2" />
                      Estudiantes relacionados
                    </h3>
                    <div className="space-y-4">
                      {selectedTutor.students.map((student, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-600 dark:text-gray-300 text-sm">Relación</p>
                              <p className="text-gray-800 dark:text-white capitalize">{student.relacion}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-300 text-sm">Nombre del estudiante</p>
                              <p className="text-gray-800 dark:text-white">
                                {student.student.person.name} {student.student.person.lastname} {student.student.person.second_lastname}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-300 text-sm">CI del estudiante</p>
                              <p className="text-gray-800 dark:text-white">{student.student.person.ci}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-300 text-sm">Matrícula</p>
                              <p className="text-gray-800 dark:text-white">{student.student.matricula}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TutorControl;