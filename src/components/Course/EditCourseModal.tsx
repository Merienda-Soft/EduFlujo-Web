'use client';
import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';  
import { getMaterias, updateCourse } from '../../utils/courseService'; 
import Swal from 'sweetalert2'; 

interface Materia {
  _id: string;
  name: string;
  status: number;
  deleted: number;
}

interface Course {
  _id: string;
  name: string;
  materias: Materia[];
}

interface EditCourseModalProps {
  show: boolean;
  onClose: () => void;
  course: Course | null;
}

const EditCourseModal: React.FC<EditCourseModalProps> = ({ show, onClose, course }) => {
  const [grade, setGrade] = useState<string>('');  
  const [parallel, setParallel] = useState<string>('');  
  const [availableMaterias, setAvailableMaterias] = useState<Materia[]>([]);  
  const [selectedMaterias, setSelectedMaterias] = useState<Materia[]>([]); 
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Manejar la apertura y carga de datos cuando el modal se muestra
  useEffect(() => {
    if (show && course) {
      const fetchAndSetMaterias = async () => {
        try {
          const materias = await getMaterias();
          const activeMaterias = materias.filter((materia: any) => materia.deleted === 0);

          const activeSelectedMaterias = course.materias.filter((materia: Materia) => materia.deleted === 0);

          const [extractedGrade, parallelLetter] = course.name.split(' ');
          setGrade(extractedGrade);
          setParallel(parallelLetter);
          setSelectedMaterias(activeSelectedMaterias);
          const selectedMateriasIds = activeSelectedMaterias.map((m: Materia) => m._id);

          const filteredMaterias = activeMaterias.filter((m) => !selectedMateriasIds.includes(m._id));
          setAvailableMaterias(filteredMaterias);
        } catch (err) {
          setError('Error al cargar las materias');
        }
      };

      fetchAndSetMaterias();
    } else if (!show) {
      // Limpieza del estado cuando se cierra el modal
      setGrade('');
      setParallel('');
      setAvailableMaterias([]);
      setSelectedMaterias([]);
      setError('');
    }
  }, [show, course]);

  // Función para manejar el cambio en el grado
  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGrade(e.target.value);
  };

  // Función para manejar el cambio en el paralelo
  const handleParallelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParallel(e.target.value);
  };

  // Función para manejar la selección de materias
  const handleMateriaSelect = (materia: Materia) => {
    setAvailableMaterias(prev => prev.filter(m => m._id !== materia._id));
    setSelectedMaterias(prev => [...prev, materia]);
  };

  // Función para eliminar materias seleccionadas
  const handleMateriaRemove = (materia: Materia) => {
    setSelectedMaterias(prev => prev.filter(m => m._id !== materia._id));
    setAvailableMaterias(prev => [...prev, materia]);
  };

  // Manejar el envío del formulario para actualizar el curso
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar que el grado y paralelo estén seleccionados
    if (!grade || !parallel) {
      setError('Por favor, selecciona el grado y paralelo.');
      setLoading(false);
      return;
    }

    // Formar el nuevo nombre del curso
    const updatedName = `${grade} ${parallel}`;

    const courseData = {
      name: updatedName,
      materias: selectedMaterias.map((materia) => materia._id),
    };

    try {
      await updateCourse(course._id, courseData);  // Llamada al servicio de actualización
      // Usar SweetAlert2 para mostrar el mensaje de éxito y recargar la página
      Swal.fire({
        title: 'Curso actualizado con éxito',
        icon: 'success',
        confirmButtonText: 'OK',
      }).then(() => {
        onClose();  
        window.location.reload();
      });
    } catch (err) {
      setError('Error al actualizar el curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} title={`Editar Curso: ${course?.name}`}>
      <form onSubmit={handleSubmit}>
        {/* Grado y paralelo en la misma línea */}
        <div className="mb-4 flex space-x-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Grado
            </label>
            <select
              value={grade}
              onChange={handleGradeChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              required
            >
              <option value="">Selecciona un grado</option>
              <option value="Primero">Primero</option>
              <option value="Segundo">Segundo</option>
              <option value="Tercero">Tercero</option>
              <option value="Cuarto">Cuarto</option>
              <option value="Quinto">Quinto</option>
              <option value="Sexto">Sexto</option>
            </select>
          </div>

          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Paralelo
            </label>
            <input
              type="text"
              value={parallel}
              onChange={handleParallelChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Ej. A, B, C"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Columna de materias disponibles */}
          <div>
            <h3 className="text-lg font-medium mb-2">Materias disponibles</h3>
            <ul className="space-y-2">
              {availableMaterias.length > 0 ? (
                availableMaterias.map((materia) => (
                  <li key={materia._id}>
                    <button
                      type="button"
                      onClick={() => handleMateriaSelect(materia)}
                      className="text-left px-4 py-2 bg-blue-900 text-white rounded-md shadow-md hover:bg-blue-800 transition duration-200"
                    >
                      {materia.name}
                    </button>
                  </li>
                ))
              ) : (
                <p>No hay más materias disponibles</p>
              )}
            </ul>
          </div>

          {/* Columna de materias seleccionadas */}
          <div>
            <h3 className="text-lg font-medium mb-2">Materias seleccionadas</h3>
            <ul className="space-y-2">
              {selectedMaterias.length > 0 ? (
                selectedMaterias.map((materia) => (
                  <li key={materia._id}>
                    <button
                      type="button"
                      onClick={() => handleMateriaRemove(materia)}
                      className="text-left px-4 py-2 bg-blue-900 text-white rounded-md shadow-md hover:bg-blue-800 transition duration-200"
                    >
                      {materia.name}
                    </button>
                  </li>
                ))
              ) : (
                <p>No has seleccionado materias</p>
              )}
            </ul>
          </div>
        </div>

        {error && <p className="text-red-600 mt-4">{error}</p>}

        <div className="mt-6">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Actualizar Curso'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditCourseModal;
