'use client';
import React, { useState } from 'react';
import Modal from '../Modal/Modal'; 
import Swal from 'sweetalert2';
import { createMateria } from '../../utils/courseService'; 

const AddSubjectModal = ({ show, onClose }: { show: boolean, onClose: () => void }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createMateria({ name });

      Swal.fire({
        title: 'Materia creada con éxito',
        icon: 'success',
        confirmButtonText: 'OK',
      }).then(() => {
        setName('');  
        window.location.reload();  
      });
    } catch (err) {
      setError('Error al crear la materia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} title="Agregar Materia">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Nombre de la Materia
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>

        {error && <p className="text-red-600 mt-4">{error}</p>}

        <div className="mt-6">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Materia'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddSubjectModal;
