"use client";
import React, { useState } from 'react';
import Swal from 'sweetalert2';

const CreateUserForm = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (password.length < 8) {
            Swal.fire('Error', 'Password must be at least 8 characters', 'error');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire('Success', 'Usuario Creado Exitosamente!', 'success', );
                setName('');
                setEmail('');
                setPassword('');
                setShowModal(false); 
                
                window.location.reload();
            } else {
                Swal.fire('Error', data.error || 'El usuario ya existe', 'error');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            Swal.fire('Error', 'Error al crear el usuario, intente de nuevo', 'error');
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
                    <div className="relative bg-white shadow-one duration-300 hover:shadow-two dark:bg-dark dark:hover:shadow-gray-dark p-6 rounded-lg w-full max-w-md">
                        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold focus:outline-none z-50"
                            onClick={() => setShowModal(false)}>
                            &times;
                        </button>
                        <h2 className="text-2xl font-semibold mb-4 text-center">Crear Usuario</h2>
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="Nombre"
                                />
                            </div>

                            <div className="mb-4">
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Correo"
                                />
                            </div>

                            <div className="mb-4">
                                <input
                                    type="password"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    placeholder="Contraseña"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
                                disabled={loading}
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
