"use client";
import React, { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import { getProfesores } from "../../utils/asignationService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserEdit, faUserSlash, faSearch, faAngleLeft, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import EditUserForm from "../../components/UserManagement/EditUserForm";

const ITEMS_PER_PAGE = 6;

const UserList = () => {
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const showLoading = () => {
    Swal.fire({
      title: "Cargando Usuarios...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  };

  const closeLoading = () => {
    Swal.close();
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const toggleBlockUser = async (user) => {
    const confirmAction = await Swal.fire({
      title: `¿Quieres ${user.blocked ? "activar" : "bloquear"} este usuario?`,
      showCancelButton: true,
      confirmButtonText: "Sí",
      cancelButtonText: "No",
    });

    if (confirmAction.isConfirmed) {
      try {
        const response = await fetch("/api/users", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.user_id,
            blocked: !user.blocked,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          Swal.fire(
            "Éxito",
            `Usuario ${user.blocked ? "activado" : "bloqueado"} con éxito`,
            "success"
          );
          setFilteredUsers((prevUsers) =>
            prevUsers.map((u) =>
              u.user_id === user.user_id ? { ...u, blocked: !u.blocked } : u
            )
          );
        } else {
          Swal.fire("Error", data.error || "Error al actualizar el usuario", "error");
        }
      } catch (error) {
        console.error("Error actualizando el usuario:", error);
        Swal.fire("Error", "Ocurrió un error", "error");
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      showLoading();
      try {
        const profesoresResponse = await getProfesores();
        const profesores = profesoresResponse.professors || [];
        
        const profesoresEmails = profesores.map(p => p.person.email.trim().toLowerCase());
        
        if (profesoresEmails.length === 0) {
          setFilteredUsers([]);
          return;
        }
        
        const userResponse = await fetch(`/api/users?emails=${profesoresEmails.join(',')}`)
          .then(res => res.json());
        
        const enrichedData = userResponse.map((user) => {
          const profesor = profesores.find(
            (p) => p.person.email.trim().toLowerCase() === user.email.trim().toLowerCase()
          );
          return {
            ...user,
            profesorData: profesor,
            searchString: `${user.email} ${profesor?.person.name || ''} ${profesor?.person.lastname || ''} ${profesor?.person.second_lastname || ''} ${profesor?.person.ci || ''}`.toLowerCase()
          };
        });
  
        setFilteredUsers(enrichedData);
        setCurrentPage(1); // Resetear a la primera página cuando cambian los datos
      } catch (error) {
        console.error("Error:", error);
        Swal.fire("Error", "Ocurrió un error al cargar los datos", "error");
      } finally {
        setLoading(false);
        closeLoading();
      }
    };
  
    fetchData();
  }, []);


  const searchedUsers = useMemo(() => {
    return filteredUsers.filter(user => 
      searchTerm === "" || 
      user.searchString.includes(searchTerm.toLowerCase())
    );
  }, [filteredUsers, searchTerm]);

  // Paginación
  const totalPages = Math.ceil(searchedUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return searchedUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [searchedUsers, currentPage]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) return null;

  return (
    <div className="container my-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Lista de Profesores</h2>
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar profesores..."
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {paginatedUsers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? "No se encontraron resultados" : "No hay profesores registrados"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {paginatedUsers.map((user) => {
              const isBlocked = user.blocked;
              const cardStyle = "shadow-lg rounded-lg p-4 flex flex-col h-full bg-white text-black dark:bg-gray-800 dark:text-white";

              const profesor = user.profesorData;
              const isTecnical = profesor?.is_tecnical === 1;
              const materias = profesor?.subjects?.split(",") || [];

              return (
                <div key={user.user_id} className={cardStyle}>
                  <div className="flex-grow">
                    <div className="flex items-center mb-4">
                      <img
                        src={user.picture}
                        alt="Profile"
                        className="w-16 h-16 rounded-full mr-4 border-2 border-gray-300"
                      />
                      <div>
                        <h3 className="font-medium">{user.email}</h3>
                        <p
                          className={`text-sm font-medium ${
                            isBlocked ? "text-red-500" : "text-green-600"
                          }`}
                        >
                          {isBlocked ? "Inactivo" : "Activo"}
                        </p>
                      </div>
                    </div>

                    {profesor && (
                      <div className="text-sm space-y-1 mb-3">
                        <p>
                          <strong>CI:</strong> {profesor.person.ci}
                        </p>
                        <p>
                          <strong>Nombre:</strong> {profesor.person.name}{" "}
                          {profesor.person.lastname}{" "}
                          {profesor.person.second_lastname}
                        </p>
                        <p>
                          <strong>Fecha Nacimiento:</strong>{" "}
                          {new Date(profesor.person.birth_date).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>
                            {isTecnical
                              ? "Materias Técnicas:"
                              : "Materias Regulares:"}
                          </strong>
                        </p>
                        <ul className="list-disc list-inside ml-2">
                          {materias.map((materia, idx) => (
                            <li key={idx}>{materia}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto">
                    <div className="text-xs text-gray-400 space-y-1 mb-3">
                      <p>
                        Último acceso:{" "}
                        {user.last_login
                          ? new Date(user.last_login).toLocaleString()
                          : "Sin inicio de sesión"}
                      </p>
                      <p>
                        Roles:{" "}
                        {user.roles && user.roles.length > 0
                          ? user.roles.join(", ") 
                          : "Sin roles"}
                      </p>
                    </div>

                    <div className="pt-3 flex justify-end gap-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => openEditModal(user)}
                        className="flex items-center gap-1 hover:text-blue-500 text-sm"
                      >
                        <FontAwesomeIcon icon={faUserEdit} /> Editar
                      </button>
                      <button
                        onClick={() => toggleBlockUser(user)}
                        className={`flex items-center gap-1 text-sm ${
                          user.blocked
                            ? "text-green-500 hover:text-green-600"
                            : "text-red-500 hover:text-red-600"
                        }`}
                      >
                        <FontAwesomeIcon icon={faUserSlash} />{" "}
                        {user.blocked ? "Activar" : "Bloquear"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-full ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                <FontAwesomeIcon icon={faAngleLeft} size="lg" />
              </button>
              
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 rounded-full ${currentPage === page 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-full ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                <FontAwesomeIcon icon={faAngleRight} size="lg" />
              </button>
            </div>
          )}
        </>
      )}

      {selectedUser && (
        <EditUserForm
          showModal={showModal}
          setShowModal={setShowModal}
          user={selectedUser}
          onSaveChanges={(updatedUser) => {
            setFilteredUsers((prevUsers) =>
              prevUsers.map((u) =>
                u.user_id === updatedUser.user_id ? updatedUser : u
              )
            );
          }}
        />
      )}
    </div>
  );
};

export default UserList;