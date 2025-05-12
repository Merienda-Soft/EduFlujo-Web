'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faSyncAlt, faIdCard, faEnvelope, faImage } from '@fortawesome/free-solid-svg-icons';
import { getTutorShipByStatus, updateTutor } from '../../utils/tutorshipService';
import Swal from 'sweetalert2';
import Breadcrumb from '../../components/Common/Breadcrumb';

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
  const router = useRouter();
  const { status } = router.query;
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

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
  }, [status, router.isReady]);

  const handleStatusUpdate = async (tutorId: number, newStatus: number) => {
    try {
      await updateTutor({ tutorId, status: newStatus });
      Swal.fire('Éxito', 'Estado del tutor actualizado correctamente', 'success');
      // Refrescar la lista
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

  if (!router.isReady || loading) {
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
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {tutor.person.name} {tutor.person.lastname} {tutor.person.second_lastname}
                    </h2>
                    <button
                      onClick={() => openModal(tutor)}
                      className="text-primary dark:text-primary-dark hover:text-primary-dark dark:hover:text-primary transition"
                      title="Ver detalles"
                    >
                      <FontAwesomeIcon icon={faIdCard} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                      <span>{tutor.person.email}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <span className="font-medium mr-2">CI:</span>
                      <span>{tutor.person.ci}</span>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Estudiantes:</h3>
                      <ul className="space-y-2">
                        {tutor.students.map((student, index) => (
                          <li key={index} className="text-gray-800 dark:text-white">
                            <span className="font-medium">{student.relacion}:</span> {student.student.person.name} {student.student.person.lastname} {student.student.person.second_lastname}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {/* Acciones según el estado */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {status === '2' && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleStatusUpdate(tutor.id, 1)}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded flex items-center justify-center space-x-2 transition"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                          <span>Aceptar</span>
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(tutor.id, 0)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded flex items-center justify-center space-x-2 transition"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    )}
                    {status === '0' && (
                      <button
                        onClick={() => handleStatusUpdate(tutor.id, 2)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center justify-center space-x-2 transition"
                      >
                        <FontAwesomeIcon icon={faSyncAlt} />
                        <span>Reactivar Solicitud</span>
                      </button>
                    )}
                    {status === '1' && (
                      <button
                        onClick={() => handleStatusUpdate(tutor.id, 0)}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded flex items-center justify-center space-x-2 transition"
                      >
                        <FontAwesomeIcon icon={faSyncAlt} className="mr-2" />
                        <span>Remitir Tutoría</span>
                      </button>
                    )}
                  </div>
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
                    Detalles del Tutor
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Información Personal</h3>
                    <div className="space-y-2">
                      <p className="text-gray-800 dark:text-white">
                        <span className="font-medium">Nombre:</span> {selectedTutor.person.name} {selectedTutor.person.lastname} {selectedTutor.person.second_lastname}
                      </p>
                      <p className="text-gray-800 dark:text-white">
                        <span className="font-medium">CI:</span> {selectedTutor.person.ci}
                      </p>
                      <p className="text-gray-800 dark:text-white">
                        <span className="font-medium">Email:</span> {selectedTutor.person.email}
                      </p>
                    </div>

                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">Estudiantes</h3>
                    <ul className="space-y-2">
                      {selectedTutor.students.map((student, index) => (
                        <li key={index} className="text-gray-800 dark:text-white">
                          <span className="font-medium">{student.relacion}:</span> {student.student.person.name} {student.student.person.lastname} {student.student.person.second_lastname}
                          <br />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            CI: {student.student.person.ci} | Matrícula: {student.student.matricula}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Documentos</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                          <FontAwesomeIcon icon={faImage} className="mr-2" />
                          <span>Anverso CI</span>
                        </p>
                        <img
                          src={selectedTutor.url_imagefront}
                          alt="Anverso de carnet"
                          className="w-full h-auto rounded border border-gray-200 dark:border-gray-700"
                        />
                      </div>
                      <div>
                        <p className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                          <FontAwesomeIcon icon={faImage} className="mr-2" />
                          <span>Reverso CI</span>
                        </p>
                        <img
                          src={selectedTutor.url_imageback}
                          alt="Reverso de carnet"
                          className="w-full h-auto rounded border border-gray-200 dark:border-gray-700"
                        />
                      </div>
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