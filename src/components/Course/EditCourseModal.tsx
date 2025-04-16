'use client';
import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import { getMaterias, updateCourse } from '../../utils/courseService';
import Swal from 'sweetalert2';
import { managementGlobal } from '../../utils/globalState';

interface Materia {
  id: string;
  subject: string;
}

interface Course {
  id: number;
  course: string;
  parallel: string;
  degree_id: number;
  degree: string;
  subject_ids: number[];
}

interface EditCourseModalProps {
  show: boolean;
  onClose: () => void;
  course: Course | null;
}

const EditCourseModal: React.FC<EditCourseModalProps> = ({ show, onClose, course }) => {
  const [availableMaterias, setAvailableMaterias] = useState<Materia[]>([]);
  const [selectedMaterias, setSelectedMaterias] = useState<Materia[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (show && course) {
      const fetchMaterias = async () => {
        try {
          const allMaterias = await getMaterias();

          const selected = allMaterias.filter((m) =>
            course.subject_ids.includes(Number(m.id))
          );
          const available = allMaterias.filter(
            (m) => !course.subject_ids.includes(Number(m.id))
          );

          setSelectedMaterias(selected);
          setAvailableMaterias(available);
        } catch (err) {
          setError('Error al cargar materias.');
        }
      };

      fetchMaterias();
    } else if (!show) {
      setSelectedMaterias([]);
      setAvailableMaterias([]);
      setError('');
    }
  }, [show, course]);

  const handleMateriaSelect = (materia: Materia) => {
    setAvailableMaterias(prev => prev.filter(m => m.id !== materia.id));
    setSelectedMaterias(prev => [...prev, materia]);
  };

  const handleMateriaRemove = (materia: Materia) => {
    setSelectedMaterias(prev => prev.filter(m => m.id !== materia.id));
    setAvailableMaterias(prev => [...prev, materia]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!course) return;

    const body = {
      course: course.course,
      parallel: course.parallel.trim(),
      degree_id: course.degree_id,
      management_id: managementGlobal.id,
      subject_ids: selectedMaterias.map((m) => Number(m.id)),
    };

    try {
      await updateCourse(course.id, body);
      Swal.fire({
        title: 'Curso actualizado',
        icon: 'success',
        confirmButtonText: 'OK',
      }).then(() => {
        onClose();
        window.location.reload();
      });
    } catch (err) {
      setError('No se pudo actualizar el curso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} title={`Editar Curso: ${course?.course}`}>
      {course && (
        <form onSubmit={handleSubmit}>
        <div className="mb-4 flex flex-col md:flex-row md:space-x-4">
          <div className="w-full md:w-1/2 mb-4 md:mb-0">
            <label className="block text-sm font-medium text-white">Grado</label>
            <input
              value={course.degree}
              readOnly
              className="mt-1 block w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 cursor-not-allowed"
            />
          </div>
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-white">Paralelo</label>
            <input
              value={course.parallel}
              readOnly
              className="mt-1 block w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 cursor-not-allowed"
            />
          </div>
        </div>
      
        <p className="text-sm text-gray-300 mb-4 italic">
          Arrastra o haz clic para mover materias entre columnas
        </p>
      
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Materias disponibles */}
          <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-white mb-3">Materias disponibles</h3>
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-gray-600">
              {availableMaterias.length > 0 ? (
                availableMaterias.map((materia) => (
                  <li key={materia.id}>
                    <button
                      type="button"
                      onClick={() => handleMateriaSelect(materia)}
                      className="w-full text-left px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-md transition"
                    >
                      {materia.subject}
                    </button>
                  </li>
                ))
              ) : (
                <p className="text-gray-400">No hay más materias disponibles</p>
              )}
            </ul>
          </div>
      
          {/* Materias seleccionadas */}
          <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-white mb-3">Materias seleccionadas</h3>
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-gray-600">
              {selectedMaterias.length > 0 ? (
                selectedMaterias.map((materia) => (
                  <li key={materia.id}>
                    <button
                      type="button"
                      onClick={() => handleMateriaRemove(materia)}
                      className="w-full text-left px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-md transition"
                    >
                      {materia.subject}
                    </button>
                  </li>
                ))
              ) : (
                <p className="text-gray-400">No has seleccionado materias</p>
              )}
            </ul>
          </div>
        </div>
      
        {error && <p className="text-red-500 mt-4">{error}</p>}
      
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-md transition"
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Actualizar Curso'}
          </button>
        </div>
      </form>
      )}
    </Modal>
  );
};

export default EditCourseModal;
