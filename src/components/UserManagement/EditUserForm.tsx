import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const EditUserForm = ({ showModal, setShowModal, user, onSaveChanges }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [blocked, setBlocked] = useState(user.blocked);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setName(user.name);
        setEmail(user.email);
        setBlocked(user.blocked);
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`/api/users`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: user.user_id, name, email, blocked }),
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire('Success', 'User updated successfully!', 'success');
                onSaveChanges({ ...user, name, email, blocked }); 
                setShowModal(false); 
            } else {
                Swal.fire('Error', data.error || 'An error occurred while updating the user', 'error');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            Swal.fire('Error', 'An unexpected error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 p-4">
                    <div className="relative bg-white shadow-one duration-300 hover:shadow-two dark:bg-dark dark:hover:shadow-gray-dark rounded-lg p-6 w-full max-w-lg">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold focus:outline-none"
                            onClick={() => setShowModal(false)}
                        >
                            &times;
                        </button>
                        <h2 className="text-2xl font-semibold mb-4 text-center">Editar Usuario</h2>
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nombre"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Correo"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={blocked}
                                    onChange={(e) => setBlocked(e.target.value === 'true')}
                                >
                                    <option value="false">Activo</option>
                                    <option value="true">Inactivo</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
                                disabled={loading}
                            >
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default EditUserForm;
