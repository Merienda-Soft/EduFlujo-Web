"use client";
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { createProfesor } from '../../utils/asignationService';
import { getMaterias } from '../../utils/courseService';

const generateRandomPassword = () => {
  const letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const number = "0123456789";
  const char = "!@#$%^&*()_+[]{}|;:,.<>?";

  const letters = Array.from({ length: 5 }, () =>
    letter.charAt(Math.floor(Math.random() * letter.length))
  );

  const numbers = Array.from({ length: 4 }, () =>
    number.charAt(Math.floor(Math.random() * number.length))
  );

  const special = char.charAt(
    Math.floor(Math.random() * char.length)
  );

  const password = [...letters, ...numbers, special]
    .sort(() => Math.random() - 0.5)
    .join("");

  return password;
};

const CreateUserForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    second_lastname: '',
    gender: 'M',
    ci: '',
    birth_date: '',
    email: '',
    pais: '',
    departamento: '',
    provincia: '',
    localidad: '',
    is_tecnical: 0,
  });

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      const data = await getMaterias();
      setSubjects(data);
    };
    fetchSubjects();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTecnicalChange = (e) => {
    const isTec = Number(e.target.value);
    setFormData(prev => ({ ...prev, is_tecnical: isTec }));

    if (isTec === 0) {
      const autoSubjects = subjects
        .filter(sub => sub.is_tecnical === 0)
        .map(sub => sub.subject);
      setSelectedSubjects(autoSubjects);
    } else {
      setSelectedSubjects([]);
    }
  };

  const handleSubjectChange = (subject, isTec) => {
    if (formData.is_tecnical === 0 && isTec === 0) return;
    if (formData.is_tecnical === 1 && isTec === 0) return;

    if (formData.is_tecnical === 1 && isTec === 1) {
      setSelectedSubjects([subject]);
    } else {
      setSelectedSubjects(prev =>
        prev.includes(subject)
          ? prev.filter(s => s !== subject)
          : [...prev, subject]
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const password = generateRandomPassword();

    try {
      const profesorResponse = await createProfesor({
        ...formData,
        temporary_password: password,
        subjects: selectedSubjects.join(','),
      });
    
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password,
        }),
      });
    
      if (!userResponse.ok) {
        const data = await userResponse.json();
        Swal.fire('Error', data.error || 'Error al crear usuario en Auth0', 'error');
        setLoading(false);
        return;
      }
    
      Swal.fire('Éxito', 'Se creó correctamente el profesor y el usuario', 'success');
    
      setFormData({
        name: '', lastname: '', second_lastname: '', gender: 'M',
        ci: '', birth_date: '', email: '', pais: '', departamento: '',
        provincia: '', localidad: '', is_tecnical: 0
      });
      setSelectedSubjects([]);
      setShowModal(false);
      window.location.reload();
    
    } catch (error) {
      console.error('Error en la creación:', error);
      Swal.fire('Error', 'Hubo un error al crear el profesor o usuario', 'error');
    } finally {
      setLoading(false);
    }
    
  };

  return (
    <div className='container'>
        {/* Botón para abrir el modal */}
        <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => setShowModal(true)}
        >
            Agregar Usuario
        </button>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="relative bg-white dark:bg-black p-8 rounded-xl w-full max-w-3xl shadow-xl">
            <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-300 text-xl"
                onClick={() => setShowModal(false)}
            >
                &times;
            </button>
        
            <h2 className="text-2xl font-semibold mb-6 text-center text-black dark:text-white">Crear Profesor</h2>
        
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[ 
                    { label: "Nombre", name: "name" },
                    { label: "Correo", name: "email", type: "email" },
                    { label: "Apellido Paterno", name: "lastname" },
                    { label: "País", name: "pais" },
                    { label: "Apellido Materno", name: "second_lastname" },
                    { label: "Departamento", name: "departamento" },
                    { label: "CI", name: "ci" },
                    { label: "Provincia", name: "provincia" },
                    { label: "Nacimiento", name: "birth_date", type: "date" },
                    { label: "Localidad", name: "localidad" }
                ].map(({ label, name, type = "text" }) => (
                    <input
                    key={name}
                    type={type}
                    name={name}
                    placeholder={label}
                    value={formData[name]}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white"
                    required
                    />
                ))}
                </div>
        
                <div className="flex items-center gap-6 mt-4">
                <label className="text-black dark:text-white font-medium">¿Es Técnico?</label>
                <label className="text-black dark:text-white">
                    <input
                      type="radio"
                      name="is_tecnical"
                      value={1}
                      checked={formData.is_tecnical === 1}
                      onChange={handleTecnicalChange}
                    /> Sí
                </label>
                <label className="text-black dark:text-white">
                    <input
                      type="radio"
                      name="is_tecnical"
                      value={0}
                      
                      onChange={handleTecnicalChange}
                    /> No
                </label>
                </div>
                <div className="flex items-center gap-6 mt-4">
                  <label className="text-black dark:text-white font-medium">Género:</label>
                  <label className="text-black dark:text-white">
                    <input
                      type="radio"
                      name="gender"
                      value="M"
                      checked={formData.gender === 'M'}
                      onChange={handleInputChange}
                    /> Masculino
                  </label>
                  <label className="text-black dark:text-white">
                    <input
                      type="radio"
                      name="gender"
                      value="F"
                      checked={formData.gender === 'F'}
                      onChange={handleInputChange}
                    /> Femenino
                  </label>
                  <label className="text-black dark:text-white">
                    <input
                      type="radio"
                      name="gender"
                      value="X"
                      checked={formData.gender === 'X'}
                      onChange={handleInputChange}
                    /> Otro
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-6 mt-4">
                <div>
                    <h4 className="font-medium mb-2 text-black dark:text-white">Generales</h4>
                    {subjects.filter(s => s.is_tecnical === 0).map(sub => (
                    <label key={sub.id} className="block text-black dark:text-white text-sm">
                        <input
                        type="checkbox"
                        checked={selectedSubjects.includes(sub.subject)}
                        disabled={formData.is_tecnical === 1}
                        onChange={() => handleSubjectChange(sub.subject, sub.is_tecnical)}
                        /> {sub.subject}
                    </label>
                    ))}
                </div>
                <div>
                    <h4 className="font-medium mb-2 text-black dark:text-white">Técnicas</h4>
                    {subjects.filter(s => s.is_tecnical === 1).map(sub => (
                    <label key={sub.id} className="block text-black dark:text-white text-sm">
                        <input
                        type="checkbox"
                        checked={selectedSubjects.includes(sub.subject)}
                        disabled={formData.is_tecnical === 0}
                        onChange={() => handleSubjectChange(sub.subject, sub.is_tecnical)}
                        /> {sub.subject}
                    </label>
                    ))}
                </div>
                </div>
        
                <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded mt-4"
                >
                {loading ? 'Creando...' : 'Crear Usuario'}
                </button>
            </form>
            </div>
        </div>
      
      )}
    </div>
  );
};

export default CreateUserForm;
