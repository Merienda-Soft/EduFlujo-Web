"use client";
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { createProfesor } from '../../utils/asignationService';
import { getMaterias } from '../../utils/courseService';
import { AutocompleteInput } from '../AutoComplete/AutocompleteInput';

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
    role: 'coordinator'
  });

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      const data = await getMaterias();
      setSubjects(data);
      
      if (formData.role === 'professor' && formData.is_tecnical === 0) {
        const regularSubjects = data
          .filter(sub => sub.is_tecnical === 0)
          .map(sub => sub.subject);
        setSelectedSubjects(regularSubjects);
      }
    };
    fetchSubjects();
  }, [formData.role, formData.is_tecnical]);

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

    const finalSubjects = formData.role === 'coordinator' 
      ? 'Coordinador Académico' 
      : selectedSubjects.join(',');

    try {
      await createProfesor({
          ...formData,
          temporary_password: password,
          subjects: finalSubjects,
      });
    
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password,
          role: formData.role
        }),
      });
    
      if (!userResponse.ok) {
        const data = await userResponse.json();
        Swal.fire('Error', data.error || 'Error al crear usuario en Auth0', 'error');
        setLoading(false);
        return;
      }
    
      Swal.fire('Éxito', `Usuario creado correctamente como ${formData.role === 'professor' ? 'profesor' : 'coordinador'}`, 'success');
    
      setFormData({
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
        role: 'coordinator'
      });
      setSelectedSubjects([]);
      setShowModal(false);
      window.location.reload();
    
    } catch (error) {
      console.error('Error en la creación:', error);
      Swal.fire('Error', 'Hubo un error al crear el usuario', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isProfessor = formData.role === 'professor';

  return (
    <div className='container'>
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
        
            <h3 className="text-1xl font-semibold mb-6 text-center text-black dark:text-white">
              Agregar nuevo usuario 
            </h3>
        
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selector de rol */}
              <div className="flex flex-col gap-2">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white"
                >
                  <option value="coordinator">Coordinador</option>
                  <option value="professor">Profesor</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[ 
                  { label: "Nombre", name: "name" },
                  { label: "Correo", name: "email", type: "email" },
                  { label: "Apellido Paterno", name: "lastname" },
                  { 
                    label: "País", 
                    name: "pais", 
                    type: "combobox",
                    comboboxType: "pais" as 'pais' 
                  },
                  { label: "Apellido Materno", name: "second_lastname" },
                  { 
                    label: "Departamento", 
                    name: "departamento", 
                    type: "combobox",
                    comboboxType: "departamento" as 'departamento' 
                  },
                  { label: "CI", name: "ci" },
                  { 
                    label: "Provincia", 
                    name: "provincia", 
                    type: "combobox",
                    comboboxType: "provincia" as 'provincia' 
                  },
                  { label: "Nacimiento", name: "birth_date", type: "date" },
                  { 
                    label: "Localidad", 
                    name: "localidad", 
                    type: "combobox",
                    comboboxType: "localidad" as 'localidad' 
                  }
                ].map(({ label, name, type = "text", comboboxType }) => (
                  type === "combobox" ? (
                    <AutocompleteInput
                      key={name}
                      value={formData[name]}
                      onChange={(value) => handleInputChange({
                        target: {
                          name: name,
                          value: value
                        }
                      })}
                      type={comboboxType}
                      placeholder={label}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white"
                    />
                  ) : (
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
                  )
                ))}
              </div>
        
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                <div>
                  <label className="text-black dark:text-white font-medium">Género</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="X">Otro</option>
                  </select>
                </div>

                {isProfessor && (
                  <div>
                    <label className="text-black dark:text-white font-medium">¿Es Técnico?</label>
                    <select
                      name="is_tecnical"
                      value={formData.is_tecnical}
                      onChange={handleTecnicalChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black text-black dark:text-white"
                    >
                      <option value={0}>No</option>
                      <option value={1}>Sí</option>
                    </select>
                  </div>
                )}
              </div>

              {isProfessor && (
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
              )}
        
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded mt-4"
              >
                {loading ? 'Creando...' : `Crear ${formData.role === 'professor' ? 'Profesor' : 'Coordinador'}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateUserForm;