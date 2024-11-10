'use client';
import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import { getMaterias, createCourse } from '../../utils/courseService';
import Swal from 'sweetalert2';  // Importa SweetAlert2

const AddCourseModal = ({ show, onClose }: { show: boolean, onClose: () => void }) => {
  const [grade, setGrade] = useState('');  // Estado para el grado
  const [parallel, setParallel] = useState('');  // Estado para el paralelo
  const [availableMaterias, setAvailableMaterias] = useState<any[]>([]);
  const [selectedMaterias, setSelectedMaterias] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Obtener las materias desde la API
  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        const materias = await getMaterias();
        const activeMaterias = materias.filter((materia: any) => materia.deleted === 0);
        setAvailableMaterias(activeMaterias);
      } catch (err) {
        setError('Error al cargar las materias');
      }
    };

    fetchMaterias();
  }, []);

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGrade(e.target.value);
  };

  const handleParallelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParallel(e.target.value);
  };

  const handleMateriaSelect = (materia: any) => {
    setAvailableMaterias(availableMaterias.filter((m) => m._id !== materia._id));
    setSelectedMaterias([...selectedMaterias, materia]);
  };

  const handleMateriaRemove = (materia: any) => {
    setSelectedMaterias(selectedMaterias.filter((m) => m._id !== materia._id));
    setAvailableMaterias([...availableMaterias, materia]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const courseName = `${grade} ${parallel}`;

    const courseData = {
      name: courseName,
      materias: selectedMaterias.map((materia) => materia._id),
    };

    try {
      await createCourse(courseData);
      
      Swal.fire({
        title: 'Curso creado con éxito',
        icon: 'success',
        confirmButtonText: 'OK',
      }).then(() => {
        setGrade('');
        setParallel('');
        setSelectedMaterias([]);
        window.location.reload(); 
      });
    } catch (err) {
      setError('Error al crear el curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} title="Agregar Curso">
      <form onSubmit={handleSubmit}>
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
                      className="px-4 py-2 bg-blue-900 text-white rounded-md shadow-md hover:bg-blue-800 transition duration-200"
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
                      className="px-4 py-2 bg-blue-900 text-white rounded-md shadow-md hover:bg-blue-700 transition duration-200"
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
            {loading ? 'Creando...' : 'Crear Curso'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddCourseModal;
