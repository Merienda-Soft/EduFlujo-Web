"use client";
import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faTimes, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const UserProfileModal = ({ onClose }: { onClose: () => void }) => {
  const { user } = useUser();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [passwordValidated, setPasswordValidated] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;


  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor completa todos los campos',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas nuevas no coinciden',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      Swal.fire({
        icon: 'error',
        title: 'Requisitos de contraseña',
        html: `
          <div class="text-left">
            <p class="mb-2">La contraseña debe cumplir con:</p>
            <ul class="list-disc pl-5 space-y-1">
              <li>Mínimo 8 caracteres</li>
              <li>Al menos una letra</li>
              <li>Al menos un número</li>
              <li>Al menos un carácter especial (@$!%*#?&)</li>
            </ul>
          </div>
        `,
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas cambiar tu contraseña?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirm.isConfirmed) return;

    setChanging(true);
    try {
      const response = await fetch('/api/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user?.sub, 
          new_password: newPassword 
        }),
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Contraseña cambiada correctamente',
          confirmButtonColor: '#2563eb',
        });
        resetPasswordForm();
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorData.error || 'Error al cambiar la contraseña',
          confirmButtonColor: '#2563eb',
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al cambiar la contraseña',
        confirmButtonColor: '#2563eb',
      });
    } finally {
      setChanging(false);
    }
  };

  const resetPasswordForm = () => {
    setShowChangePassword(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordValidated(false);
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-50 flex items-center justify-center rounded-xl">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-black dark:text-gray-200">
            Perfil de Usuario
          </h3>
          <button
            onClick={onClose}
            className=" text-black dark:text-gray-200 hover:text-blue-200 transition-colors"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-4">
            {user.picture && (
              <img
                src={user.picture}
                alt="Profile"
                className="w-16 h-16 rounded-full border-2 border-blue-500"
              />
            )}
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                {user.name || user.email}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {user.email}
              </p>
              <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                user.email_verified 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {user.email_verified ? 'Verificado' : 'No verificado'}
              </span>
            </div>
          </div>

          {!showChangePassword ? (
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faLock} />
              <span>Cambiar Contraseña</span>
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    disabled={passwordValidated}
                    className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-70"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400"
                  >
                    <FontAwesomeIcon icon={showOldPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400"
                      >
                        <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
                    {newPassword && !passwordRegex.test(newPassword) && (
                      <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                        La contraseña debe tener al menos 8 caracteres, incluyendo letras, números y caracteres especiales (@$!%*#?&)
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400"
                      >
                        <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                        Las contraseñas no coinciden
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={handleChangePassword}
                      disabled={changing || !passwordRegex.test(newPassword) || newPassword !== confirmPassword}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {changing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Cambiando...</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faLock} />
                          <span>Cambiar</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={resetPasswordForm}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2.5 px-4 rounded-lg transition-colors"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;