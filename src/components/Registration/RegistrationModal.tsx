import React, { useState, useEffect } from 'react';
import Modal from '../Modal/ModalData';
import Swal from 'sweetalert2';
import { uploadPdf, getInscriptionsByCourseId, createInscripcion, updateInscripcion } from '../../utils/registrationService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { managementGlobal } from '../../utils/globalState';

interface RegistrationModalProps {
  show: boolean;
  onClose: () => void;
  courseId: number;
}

interface Student {
  rude: string;
  ci: string;
  name: string;
  lastname: string;
  second_lastname: string;
  gender: string;
  datebirth: string;
  pais: string;
  departamento: string;
  provincia: string;
  localidad: string;
  matricula: string;
  isExisting?: boolean;
  registrationId?: number;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ show, onClose, courseId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [existingStudents, setExistingStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isCurrentYear = managementGlobal.year === new Date().getFullYear();

  useEffect(() => {
    const fetchExistingStudents = async () => {
      try {
        setIsLoading(true);
        const existingInscriptions = await getInscriptionsByCourseId(courseId);
        
        const formattedStudents = existingInscriptions.map((ins: any) => {
          const person = ins.student?.person || {};
          return {
            rude: ins.student?.rude || '',
            ci: person.ci || '',
            name: `${person.lastname || ''} ${person.second_lastname || ''} ${person.name || ''}`.trim(),
            lastname: person.lastname || '',
            second_lastname: person.second_lastname || '',
            gender: person.gender?.trim() || '',
            datebirth: person.birth_date ? new Date(person.birth_date).toISOString().split('T')[0] : '',
            pais: person.town?.province?.departament?.country?.country || '',
            departamento: person.town?.province?.departament?.departament || '',
            provincia: person.town?.province?.province || '',
            localidad: person.town?.town || '',
            matricula: ins.student?.matricula || '',
            isExisting: true,
            registrationId: ins.id
          };
        });

        setExistingStudents(formattedStudents);
        setStudents(formattedStudents);
      } catch (error) {
        console.error('Error al obtener inscripciones existentes:', error);
        setError('Error al cargar estudiantes existentes');
      } finally {
        setIsLoading(false);
      }
    };

    if (show) {
      fetchExistingStudents();
    } else {
      setStudents([]);
      setExistingStudents([]);
    }
  }, [show, courseId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      handleUpload(selectedFile);
    } else {
      Swal.fire('Por favor, carga un archivo PDF válido.', '', 'warning');
    }
  };

  const parseSpanishDate = (dateString: string): string => {
    if (!dateString) return '';
    
    // Mapeo de meses en español a números
    const months: Record<string, string> = {
      'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
      'set': '09', 'oct': '10', 'nov': '11', 'dic': '12'
    };
  
    try {
      const parts = dateString.split(' ');
      const day = parts[0].padStart(2, '0');
      const monthAbbr = parts[2].toLowerCase().substring(0, 3);
      const month = months[monthAbbr];
      const year = parts[4];
  
      if (!day || !month || !year) {
        console.error('Formato de fecha no reconocido:', dateString);
        return '';
      }
  
      const isoDate = `${year}-${month}-${day}`;
      
      if (isNaN(new Date(isoDate).getTime())) {
        console.error('Fecha inválida generada:', isoDate);
        return '';
      }
  
      return isoDate;
    } catch (error) {
      console.error('Error al parsear fecha:', error);
      return '';
    }
  };

  const handleUpload = async (file: File) => {
    try {
      setIsLoading(true);
      const pdfData = await uploadPdf(file);
      console.log('Datos del PDF:', pdfData);
      const mergedStudents = [...students];
      
      pdfData.forEach((student: any) => {
        const existingIndex = mergedStudents.findIndex(s => s.rude === student.rude);
        const fullName = `${student.name || ''} ${student.lastname || ''} ${student.second_lastname || ''}`.trim();
        
        const parsedDate = student.datebirth ? parseSpanishDate(student.datebirth) : '';
        
        if (existingIndex >= 0) {
          mergedStudents[existingIndex] = {
            ...mergedStudents[existingIndex],
            ...student,
            name: fullName,
            datebirth: parsedDate || mergedStudents[existingIndex].datebirth
          };
        } else {
          mergedStudents.push({
            ...student,
            name: fullName,
            datebirth: parsedDate,
            isExisting: false
          });
        }
      });
  
      setStudents(mergedStudents);
      setError(null);
    } catch (error) {
      console.error('Error procesando PDF:', error);
      Swal.fire('Error procesando el archivo PDF. Inténtalo nuevamente.', '', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (index: number, field: keyof Student, value: string) => {
    const updated = [...students];
    updated[index] = {
      ...updated[index],
      [field]: value
    };

    if (field === 'lastname' || field === 'second_lastname') {
      updated[index].name = `${updated[index].name.split(' ')[0] || ''} ${updated[index].lastname || ''} ${updated[index].second_lastname || ''}`.trim();
    }

    setStudents(updated);
  };

  const handleDeleteRow = (index: number) => {
    const student = students[index];
    if (student.isExisting) {
      Swal.fire('No se puede eliminar', 'Este estudiante ya está registrado en el sistema.', 'warning');
      return;
    }

    const updated = [...students];
    updated.splice(index, 1);
    setStudents(updated);
  };

  const handleAddRow = () => {
    setStudents([
      ...students,
      {
        rude: '',
        ci: '',
        name: '',
        lastname: '',
        second_lastname: '',
        gender: '',
        datebirth: '',
        pais: '',
        departamento: '',
        provincia: '',
        localidad: '',
        matricula: '',
        isExisting: false
      }
    ]);
  };

  const handleRegisterInscriptions = async () => {
    try {
      setIsLoading(true);
      
      const studentsToUpdate = students.filter(s => s.isExisting);
      const studentsToCreate = students.filter(s => !s.isExisting);

      if (studentsToUpdate.length > 0) {
        const updatePayload = {
          registrationUpdates: studentsToUpdate.map(student => {
            const nameParts = student.name.trim().split(/\s+/);
            const lastname = nameParts[0] || '';
            const second_lastname = nameParts[1] || '';
            const name = nameParts.slice(2).join(' ') || '';
            return {
              registrationId: student.registrationId,
              data: {
                rude: student.rude,
                ci: student.ci, 
                name: name,
                lastname: lastname,
                second_lastname: second_lastname,
                gender: student.gender, 
                datebirth: student.datebirth,
                pais: student.pais,
                departamento: student.departamento,
                provincia: student.provincia,
                localidad: student.localidad,
                matricula: student.matricula
              }
            };
          })
        };
        console.log('Update Payload:', updatePayload);
        await updateInscripcion(updatePayload);
      }

      if (studentsToCreate.length > 0) {
        const createPayload = {
          dataAssignment: studentsToCreate.map(student => ({
            rude: student.rude,
            ci: student.ci,
            name: student.name,
            gender: student.gender,
            datebirth: student.datebirth,
            pais: student.pais,
            departamento: student.departamento,
            provincia: student.provincia,
            localidad: student.localidad,
            matricula: student.matricula
          })),
          registrationData: {
            courseId: Number(courseId),
            managementId: managementGlobal.id
          }
        };
        console.log('Create Payload:', createPayload);      
        await createInscripcion(createPayload);
      }
      
      Swal.fire('Éxito', 'Inscripciones procesadas correctamente.', 'success');
      onClose();
    } catch (error) {
      console.error('Error al registrar inscripciones:', error);
      Swal.fire('Error', 'Hubo un problema al registrar las inscripciones.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} title="Inscripción de Estudiantes">
      <div className="flex flex-col space-y-4 dark:text-white">
      {isCurrentYear && (
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
            />
            <label
              htmlFor="fileInput"
              className="p-2 cursor-pointer bg-blue-700 text-white rounded hover:bg-blue-600 text-sm dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Seleccionar PDF
            </label>
            <button
              onClick={handleAddRow}
              className="p-2 bg-yellow-600 text-white rounded hover:bg-yellow-500 text-sm dark:bg-yellow-700 dark:hover:bg-yellow-600"
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faPlus} /> Agregar fila
            </button>
          </div>
          <button
            onClick={handleRegisterInscriptions}
            className="p-2 bg-green-700 text-white rounded hover:bg-green-600 text-sm dark:bg-green-600 dark:hover:bg-green-700"
            disabled={isLoading || students.length === 0}
          >
            {isLoading ? 'Procesando...' : 'Registrar Inscripciones'}
          </button>
        </div>
      )}

        {!isCurrentYear && (
          <div className="text-center py-4 text-white-500 dark:text-white-400">
            <p>Estudiantes Registrados en la gestion: {managementGlobal.year}.</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-4">
            <p>Cargando datos. Esto puede tardar minutos por favor espere...</p>
          </div>
        )}

        {error && <p className="text-red-500 dark:text-red-400">{error}</p>}

        {students.length > 0 && (
          <div className="overflow-x-auto max-h-96 border border-gray-300 rounded-lg dark:border-gray-700">
            <table className="min-w-full text-sm table-fixed border-collapse bg-white dark:bg-gray-800">
              <thead>
                <tr className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  <th className="p-2 border border-gray-300 dark:border-gray-600 w-20">RUDE</th>
                  <th className="p-2 border border-gray-300 dark:border-gray-600 w-20">CI</th>
                  <th className="p-2 border border-gray-300 dark:border-gray-600">Nombre</th>
                  <th className="p-2 border border-gray-300 dark:border-gray-600 w-5">Género</th>
                  <th className="p-2 border border-gray-300 dark:border-gray-600 w-20">Nacimiento</th>
                  <th className="p-2 border border-gray-300 dark:border-gray-600 w-20">País</th>
                  <th className="p-2 border border-gray-300 dark:border-gray-600">Departamento</th>
                  <th className="p-2 border border-gray-300 dark:border-gray-600">Provincia</th>
                  <th className="p-2 border border-gray-300 dark:border-gray-600">Localidad</th>
                  <th className="p-2 border border-gray-300 dark:border-gray-600 w-20">Matrícula</th>
                  <th className="p-2 border border-gray-300 dark:border-gray-600 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr 
                    key={index} 
                    className={`${student.isExisting ? 'bg-green-50 text-green-900 dark:border-green-900 dark:bg-gray-800 dark:text-green-100' : 'bg-white dark:bg-gray-800'}`}
                  >
                    <td className="p-2 border border-gray-300 dark:border-gray-600">
                      <input
                        type="text"
                        className={`w-full bg-transparent outline-none ${student.isExisting ? 'text-green-800 font-semibold dark:text-green-200' : 'dark:text-white'}`}
                        value={student.rude}
                        onChange={(e) => handleInputChange(index, 'rude', e.target.value)}
                        disabled={isLoading}
                      />
                    </td>
                    <td className="p-2 border border-gray-300 dark:border-gray-600">
                      <input
                        type="text"
                        className={`w-full bg-transparent outline-none ${student.isExisting ? 'text-green-800 dark:text-green-200' : 'dark:text-white'}`}
                        value={student.ci}
                        onChange={(e) => handleInputChange(index, 'ci', e.target.value)}
                        disabled={isLoading}
                      />
                    </td>
                    <td className="p-2 border border-gray-300 dark:border-gray-600">
                      <input
                        type="text"
                        className={`w-full bg-transparent outline-none ${student.isExisting ? 'text-green-800 font-semibold dark:text-green-200' : 'dark:text-white'}`}
                        value={student.name}
                        onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                        disabled={isLoading}
                      />
                    </td>
                    <td className="p-2 border border-gray-300 dark:border-gray-600">
                      <input
                        type="text"
                        className={`w-full bg-transparent outline-none ${student.isExisting ? 'text-green-800 dark:text-green-200' : 'dark:text-white'}`}
                        value={student.gender}
                        onChange={(e) => handleInputChange(index, 'gender', e.target.value)}
                        disabled={isLoading}
                      />
                    </td>
                    <td className="p-2 border border-gray-300 dark:border-gray-600">
                      <input
                        type="date"
                        className={`w-full bg-transparent outline-none ${student.isExisting ? 'text-green-800 dark:text-green-200' : 'dark:text-white'}`}
                        value={student.datebirth}
                        onChange={(e) => handleInputChange(index, 'datebirth', e.target.value)}
                        disabled={isLoading}
                      />
                    </td>
                    <td className="p-2 border border-gray-300 dark:border-gray-600">
                      <input
                        type="text"
                        className={`w-full bg-transparent outline-none ${student.isExisting ? 'text-green-800 dark:text-green-200' : 'dark:text-white'}`}
                        value={student.pais}
                        onChange={(e) => handleInputChange(index, 'pais', e.target.value)}
                        disabled={isLoading}
                      />
                    </td>
                    <td className="p-2 border border-gray-300 dark:border-gray-600">
                      <input
                        type="text"
                        className={`w-full bg-transparent outline-none ${student.isExisting ? 'text-green-800 dark:text-green-200' : 'dark:text-white'}`}
                        value={student.departamento}
                        onChange={(e) => handleInputChange(index, 'departamento', e.target.value)}
                        disabled={isLoading}
                      />
                    </td>
                    <td className="p-2 border border-gray-300 dark:border-gray-600">
                      <input
                        type="text"
                        className={`w-full bg-transparent outline-none ${student.isExisting ? 'text-green-800 dark:text-green-200' : 'dark:text-white'}`}
                        value={student.provincia}
                        onChange={(e) => handleInputChange(index, 'provincia', e.target.value)}
                        disabled={isLoading}
                      />
                    </td>
                    <td className="p-2 border border-gray-300 dark:border-gray-600">
                      <input
                        type="text"
                        className={`w-full bg-transparent outline-none ${student.isExisting ? 'text-green-800 dark:text-green-200' : 'dark:text-white'}`}
                        value={student.localidad}
                        onChange={(e) => handleInputChange(index, 'localidad', e.target.value)}
                        disabled={isLoading}
                      />
                    </td>
                    <td className="p-2 border border-gray-300 dark:border-gray-600">
                      <input
                        type="text"
                        className={`w-full bg-transparent outline-none ${student.isExisting ? 'text-green-800 dark:text-green-200' : 'dark:text-white'}`}
                        value={student.matricula}
                        onChange={(e) => handleInputChange(index, 'matricula', e.target.value)}
                        disabled={isLoading}
                      />
                    </td>
                    <td className="p-2 border border-gray-300 dark:border-gray-600 text-center">
                      {!student.isExisting && (
                        <button
                          onClick={() => handleDeleteRow(index)}
                          className="text-red-500 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300"
                          disabled={isLoading}
                          title="Eliminar estudiante"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && students.length === 0 && existingStudents.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No hay estudiantes registrados para este curso.</p>
            <p>Cargue un archivo PDF o agregue estudiantes manualmente.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RegistrationModal;