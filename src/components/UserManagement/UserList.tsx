"use client";
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import $ from 'jquery';
import 'datatables.net-bs5';
import EditUserForm from '../../components/UserManagement/EditUserForm'; 

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const showLoading = () => {
    Swal.fire({
      title: 'Cargando Usuarios...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  };

  const closeLoading = () => {
    Swal.close();
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      showLoading(); 
      try {
        const response = await fetch('/api/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar los usuarios', 'error');
      } finally {
        setLoading(false);
        closeLoading(); 
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!loading && users.length > 0) {
      setTimeout(() => {
        if (!$.fn.DataTable.isDataTable('#userTable')) {
          $('#userTable').DataTable({
            lengthChange: false,
            pagingType: 'simple',
            pageLength: 10,
            info: false,
            language: {
              search: 'Buscar:',
              zeroRecords: 'No se encontraron registros',
              emptyTable: 'No hay datos disponibles',
            },
          });
        }
      }, 1000);
    }

    return () => {
      if ($.fn.DataTable.isDataTable('#userTable')) {
        $('#userTable').DataTable().destroy(); 
      }
    };
  }, [loading, users]);
  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };
  const toggleBlockUser = async (user) => {
    const confirmAction = await Swal.fire({
      title: `¿Quieres ${user.blocked ? 'Activar' : 'Bloquear'} este usuario?`,
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
    });

    if (confirmAction.isConfirmed) {
      try {
        const response = await fetch(`/api/users`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.user_id,
            blocked: !user.blocked,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          Swal.fire('Success', `Usuario ${user.blocked ? 'activado' : 'bloqueado'} con éxito`, 'success');
          setUsers((prevUsers) =>
            prevUsers.map((u) =>
              u.user_id === user.user_id ? { ...u, blocked: !user.blocked } : u
            )
          );
        } else {
          Swal.fire('Error', data.error || 'Error al actualizar el usuario', 'error');
        }
      } catch (error) {
        console.error('Error blocking/unblocking user:', error);
        Swal.fire('Error', 'Ocurrió un error', 'error');
      }
    }
  };

  if (loading) return null; // Si está cargando, ya mostramos el Swal

  return (
    <div className="container mb-2">
      {/* Tabla con DataTables */}
      <table id="userTable" className="table table-striped table-bordered text-center" style={{ width: '100%' }}>
        <thead className="thead-dark">
          <tr>
            <th></th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Estado</th>
            <th>Ultima Sesion</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.user_id}>
              <td>
                <img src={user.picture} alt="Profile" style={{ width: '50px', borderRadius: '50%' }} />
              </td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td className={`px-4 py-2 ${user.blocked ? 'text-red-500' : 'text-green-500'}`}>
                {user.blocked ? 'Inactivo' : 'Activo'}
              </td>
              <td>{user.last_login ? new Date(user.last_login).toLocaleDateString() : "Sin inicio de sesion"}</td>
              <td>
                <div className="relative inline-block text-left">
                  <button
                    className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 focus:outline-none"
                    onClick={() => document.getElementById(`dropdown-${user.user_id}`).classList.toggle('hidden')}
                  >
                    ...
                  </button>

                  <div
                    id={`dropdown-${user.user_id}`}
                    className="hidden origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  >
                    <div className="py-1">
                      <button
                        onClick={() => {
                          document.getElementById(`dropdown-${user.user_id}`).classList.add('hidden');
                          openEditModal(user); 
                        }}
                        className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => {
                          document.getElementById(`dropdown-${user.user_id}`).classList.add('hidden');
                          toggleBlockUser(user); 
                        }}
                        className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        {user.blocked ? 'Activar' : 'Bloquear'}
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedUser && (
        <EditUserForm
          showModal={showModal}
          setShowModal={setShowModal}
          user={selectedUser}
          onSaveChanges={(updatedUser) => {
            setUsers((prevUsers) =>
              prevUsers.map((u) => (u.user_id === updatedUser.user_id ? updatedUser : u))
            );
          }}
        />
      )}
    </div>
  );
};

export default UserList;