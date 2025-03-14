import React, { useEffect, useState } from 'react';
import Modal from '../Modal/Modal'; 
import Swal from 'sweetalert2';
import { updateMateriaState } from '../../utils/courseService'; 
import { httpRequestFactory } from '../../utils/HttpRequestFactory'; 

interface Subject {
  _id: string;
  name: string;
  deleted: number;
}

const ManageSubjectsModal = ({ show, onClose }: { show: boolean, onClose: () => void }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modifiedSubjects, setModifiedSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setLoading(true);
      const { url, config } = httpRequestFactory.createRequest('/subjects');

      fetch(url, config)
        .then((res) => {
          if (!res.ok) throw new Error('Error al cargar las materias');
          return res.json();
        })
        .then((data) => {
          setSubjects(data);
          setLoading(false);
        })
        .catch(() => {
          setError('Error al cargar las materias');
          setLoading(false);
        });
    }
  }, [show]);

  const toggleSubjectState = (subject: Subject) => {
    setSubjects((prevSubjects) =>
      prevSubjects.map((s) =>
        s._id === subject._id ? { ...s, deleted: subject.deleted === 0 ? 1 : 0 } : s
      )
    );

    setModifiedSubjects((prevModified) => {
      const isAlreadyModified = prevModified.some((s) => s._id === subject._id);
      if (isAlreadyModified) {
        return prevModified.map((s) =>
          s._id === subject._id ? { ...s, deleted: subject.deleted === 0 ? 1 : 0 } : s
        );
      } else {
        return [...prevModified, { ...subject, deleted: subject.deleted === 0 ? 1 : 0 }];
      }
    });
  };

  const handleSaveChanges = async () => {
    try {
      await Promise.all(modifiedSubjects.map((subject) => updateMateriaState(subject._id, subject.deleted)));
      Swal.fire({
        title: 'Cambios guardados con éxito',
        icon: 'success',
        confirmButtonText: 'OK',
      }).then(() => {
        setModifiedSubjects([]);  
        onClose();  
        window.location.reload();
      });
    } catch (err) {
      setError('Error al guardar los cambios');
    }
  };

  return (
    <>
      {/* Modal de administración de materias */}
      <Modal show={show} onClose={onClose} title="Administrar Materias">
        {loading && <p>Cargando materias...</p>}
        {error && <p className="text-red-600 mt-4">{error}</p>}
        {!loading && (
          <div className="flex space-x-4">
            {/* Materias Activas */}
            <div className="w-1/2">
              <h3 className="text-xl font-semibold mb-2">Materias Activas</h3>
              <ul>
                {subjects.filter((subject) => subject.deleted === 0).map((subject) => (
                  <li key={subject._id} className="flex justify-start items-center mb-2">
                    <button
                      className="px-4 py-2 bg-blue-900 text-white rounded-md shadow-md hover:bg-blue-800 transition duration-200"
                      onClick={() => toggleSubjectState(subject)}
                    >
                      {subject.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Materias Inactivas */}
            <div className="w-1/2">
              <h3 className="text-xl font-semibold mb-2">Materias Inactivas</h3>
              <ul>
                {subjects.filter((subject) => subject.deleted === 1).map((subject) => (
                  <li key={subject._id} className="flex justify-start items-center mb-2">
                    <button
                      className="px-4 py-2 bg-blue-900 text-white rounded-md shadow-md hover:bg-blue-800 transition duration-200"
                      onClick={() => toggleSubjectState(subject)}
                    >
                      {subject.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-between">
          <button
            onClick={handleSaveChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700"
          >
            Guardar Cambios
          </button>
        </div>
      </Modal>
    </>
  );
};

export default ManageSubjectsModal;
