import React, { useState, useEffect } from 'react';
import Modal from '../Modal/ModalData';
import Swal from 'sweetalert2';
import { uploadPdf } from '../../utils/registrationService';
import { getInscriptionsByCourseId, createInscripcion } from '../../utils/registrationService';

interface RegistrationModalProps {
  show: boolean;
  onClose: () => void;
  courseId: number;
}

interface Student {
  rude: string;
  ci: string;
  name: string;
  gender: string;
  datebirth: string;
  pais: string;
  departamento: string;
  provincia: string;
  localidad: string;
  curso: string;
  matricula: string;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ show, onClose, courseId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudents, setNewStudents] = useState<Student[]>([]);
  const [existingRudes, setExistingRudes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExistingRudes = async () => {
      try {
        const existingInscriptions = await getInscriptionsByCourseId(courseId);
        const rudes = existingInscriptions.map((inscription) => inscription.rude);
        setExistingRudes(rudes);
      } catch (error) {
        console.error('Error al obtener inscripciones existentes:', error);
      }
    };

    if (show) {
      fetchExistingRudes();
    }
  }, [show, courseId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      handleUpload(selectedFile); 
    } else {
      Swal.fire('Por favor, carga un archivo PDF.', 'question');
    }
  };

  const handleUpload = async (selectedFile: File) => {
    try {
      const studentData = await uploadPdf(selectedFile);
      setStudents(studentData);
      filterNewStudents(studentData);
      setError(null);
    } catch (error) {
      Swal.fire('Error procesando el archivo PDF. Inténtalo nuevamente.', 'error');
    }
  };

  const filterNewStudents = (studentData: Student[]) => {
    const filteredStudents = studentData.filter(student => !existingRudes.includes(student.rude));
    setNewStudents(filteredStudents);
  };

  const handleRegisterInscriptions = async () => {
    try {
      const inscriptionsToCreate = newStudents.map(student => ({
        ...student,
        curso: courseId
      }));

      await Promise.all(inscriptionsToCreate.map(createInscripcion));
      Swal.fire('Éxito', 'Inscripciones registradas con éxito.', 'success');
      onClose(); 
    } catch (error) {
      console.error('Error al registrar inscripciones:', error);
      Swal.fire('Error', 'Error al registrar inscripciones. Inténtalo nuevamente.', 'error');
    }
  };

  return (
    <Modal show={show} onClose={onClose} title="Inscripción de Estudiantes">
      <div className="flex justify-between items-center mb-4">
        <label className="block text-gray-400 text-sm font-bold">
          Cargar archivo PDF
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="fileInput"
        />
        <label
          htmlFor="fileInput"
          className="p-2 cursor-pointer bg-blue-700 text-white rounded hover:bg-blue-600 text-sm"
        >
          Seleccionar PDF
        </label>
        <button
          onClick={handleRegisterInscriptions}
          className="ml-auto p-2 bg-green-700 text-white rounded hover:bg-green-600 text-sm"
        >
          Registrar Inscripciones
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {newStudents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-300">Lista de Estudiantes Nuevos</h2>
          <div className="overflow-x-auto max-h-80 border border-gray-700 rounded-lg">
            <table className="min-w-full text-xs table-fixed border-collapse border border-gray-600 bg-gray-800 text-gray-200">
              <thead>
                <tr className="bg-gray-900 text-gray-400">
                  <th className="p-2 border border-gray-700">Código Rude</th>
                  <th className="p-2 border border-gray-700">Carnet</th>
                  <th className="p-2 border border-gray-700">Nombre Completo</th>
                  <th className="p-2 border border-gray-700">Género</th>
                  <th className="p-2 border border-gray-700">Fecha de Nacimiento</th>
                  <th className="p-2 border border-gray-700">País</th>
                  <th className="p-2 border border-gray-700">Departamento</th>
                  <th className="p-2 border border-gray-700">Provincia</th>
                  <th className="p-2 border border-gray-700">Localidad</th>
                  <th className="p-2 border border-gray-700">Matricula</th>
                </tr>
              </thead>
              <tbody>
                {newStudents.map((student, index) => (
                  <tr key={index} className="hover:bg-gray-700">
                    <td className="p-2 border border-gray-700">{student.rude}</td>
                    <td className="p-2 border border-gray-700">{student.ci}</td>
                    <td className="p-2 border border-gray-700">{student.name}</td>
                    <td className="p-2 border border-gray-700">{student.gender}</td>
                    <td className="p-2 border border-gray-700">{student.datebirth}</td>
                    <td className="p-2 border border-gray-700">{student.pais}</td>
                    <td className="p-2 border border-gray-700">{student.departamento}</td>
                    <td className="p-2 border border-gray-700">{student.provincia}</td>
                    <td className="p-2 border border-gray-700">{student.localidad}</td>
                    <td className="p-2 border border-gray-700">{student.matricula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default RegistrationModal;
