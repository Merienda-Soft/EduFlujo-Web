'use client';
import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import { getMaterias, createCourse } from '../../utils/courseService';
import Swal from 'sweetalert2';
import { getCurrentManagementData } from '../../utils/globalState';

interface Materia {
  id: number;
  subject: string;
}

interface AddCourseModalProps {
  show: boolean;
  onClose: () => void;
  selectedGrade: string;
  selectedGradeId: number;
  existingParallels: string[];
  refreshCourses: () => void;
}

const AddCourseModal: React.FC<AddCourseModalProps> = ({
  show,
  onClose,
  selectedGrade,
  selectedGradeId,
  existingParallels,
  refreshCourses,
}) => {
  const [grade, setGrade] = useState(selectedGrade);
  const [parallel, setParallel] = useState('');
  const [availableMaterias, setAvailableMaterias] = useState<Materia[]>([]);
  const [selectedMaterias, setSelectedMaterias] = useState<Materia[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      const fetchMaterias = async () => {
        try {
          const materias = await getMaterias();
          setAvailableMaterias([]);
          setSelectedMaterias(materias);
        } catch (err) {
          setError('Error al cargar las materias');
          console.error('Error fetching materias:', err);
        }
      };

      const calcularSiguienteParalelo = () => {
        const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let letra of letras) {
          if (!existingParallels.includes(letra)) {
            setParallel(letra);
            break;
          }
        }
      };

      setGrade(selectedGrade);
      calcularSiguienteParalelo();
      fetchMaterias();
    }
  }, [show, selectedGrade, existingParallels]);

  const handleMateriaSelect = (materia: Materia) => {
    setAvailableMaterias((prev) => prev.filter((m) => m.id !== materia.id));
    setSelectedMaterias((prev) => [...prev, materia]);
  };

  const handleMateriaRemove = (materia: Materia) => {
    setSelectedMaterias((prev) => prev.filter((m) => m.id !== materia.id));
    setAvailableMaterias((prev) => [...prev, materia]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!parallel) {
      setError('Debe ingresar un paralelo');
      setLoading(false);
      return;
    }

    if (selectedMaterias.length === 0) {
      setError('Debe seleccionar al menos una materia');
      setLoading(false);
      return;
    }

    if (!getCurrentManagementData()?.id) {
      setError('No se ha configurado la gestión académica');
      setLoading(false);
      return;
    }

    const courseData = {
      course: `${selectedGradeId}° ${parallel}`,
      parallel: parallel,
      degree_id: selectedGradeId,
      management_id: getCurrentManagementData().id,
      subject_ids: selectedMaterias.map((materia) => materia.id),
    };

    try {
      await createCourse(courseData)

      Swal.fire({
        title: 'Éxito',
        text: 'Curso creado correctamente',
        icon: 'success',
      });

      setParallel('');
      setSelectedMaterias([]);
      refreshCourses();
      onClose();
    } catch (err) {
      console.error('Error creating course:', err);
      setError('Error al crear el curso');
      Swal.fire({
        title: 'Error',
        text: 'Ocurrió un error al crear el curso',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} title="Agregar Curso">
      <form onSubmit={handleSubmit}>
        <div className="mb-4 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Grado
            </label>
            <input
              type="text"
              value={grade}
              readOnly
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-black dark:text-white"
            />
          </div>

          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Paralelo
            </label>
            <input
              type="text"
              value={parallel}
              readOnly
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-black dark:text-white"
            />
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          * Haz clic para mover materias entre listas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">
              Materias disponibles
            </h3>
            <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
              {availableMaterias.length > 0 ? (
                <ul className="space-y-2">
                  {availableMaterias.map((materia) => (
                    <li key={materia.id}>
                      <button
                        type="button"
                        onClick={() => handleMateriaSelect(materia)}
                        className="w-full text-left px-4 py-2 bg-blue-900 text-white rounded-md shadow hover:bg-blue-800 transition"
                      >
                        {materia.subject}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No hay materias disponibles
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">
              Materias seleccionadas
            </h3>
            <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
              {selectedMaterias.length > 0 ? (
                <ul className="space-y-2">
                  {selectedMaterias.map((materia) => (
                    <li key={materia.id}>
                      <button
                        type="button"
                        onClick={() => handleMateriaRemove(materia)}
                        className="w-full text-left px-4 py-2 bg-green-700 text-white rounded-md shadow hover:bg-green-600 transition"
                      >
                        {materia.subject}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No has seleccionado materias
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-900 dark:border-red-400 dark:text-red-200 rounded">
            <p>{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-md shadow hover:bg-gray-400 dark:hover:bg-gray-500 transition"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin mr-2">↻</span>
                Creando...
              </>
            ) : (
              'Crear Curso'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddCourseModal;
