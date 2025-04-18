"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getProfesores } from "../../utils/asignationService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserEdit, faUserSlash } from "@fortawesome/free-solid-svg-icons";
import EditUserForm from "../../components/UserManagement/EditUserForm";

const UserList = () => {
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

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
        const [userResponse, profesoresResponse] = await Promise.all([
          fetch("/api/users").then((res) => res.json()),
          getProfesores(),
        ]);

        const profesores = profesoresResponse.professors || [];

        const profesoresEmails = profesores.map((p) =>
          p.person.email.trim().toLowerCase()
        );
        const matchedUsers = userResponse.filter((user) =>
          profesoresEmails.includes(user.email.trim().toLowerCase())
        );

        const enrichedData = matchedUsers.map((user) => {
          const profesor = profesores.find(
            (p) =>
              p.person.email.trim().toLowerCase() ===
              user.email.trim().toLowerCase()
          );
          return {
            ...user,
            profesorData: profesor,
          };
        });

        setFilteredUsers(enrichedData);
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

  if (loading) return null;

  return (
    <div className="container my-4">
      <h2 className="text-2xl font-semibold mb-4">Lista de Profesores</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => {
          const isBlocked = user.blocked;
          const cardStyle =
            "shadow-lg rounded-lg p-4 flex flex-col justify-between bg-white text-black dark:bg-gray-800 dark:text-white";

          const profesor = user.profesorData;
          const isTecnical = profesor?.is_tecnical === 1;
          const materias = profesor?.subjects?.split(",") || [];

          return (
            <div key={user.user_id} className={cardStyle}>
              <div>
                <div className="flex items-center mb-4">
                  <img
                    src={user.picture}
                    alt="Profile"
                    className="w-16 h-16 rounded-full mr-4 border-2 border-gray-300"
                  />
                  <div>
                    <h3>{user.email}</h3>
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

                <p className="text-xs text-gray-400 mt-2">
                  Último acceso:{" "}
                  {user.last_login
                    ? new Date(user.last_login).toLocaleString()
                    : "Sin inicio de sesión"}
                </p>
              </div>

              <div className="mt-4 pt-3 flex justify-end gap-4">
                <button
                  onClick={() => openEditModal(user)}
                  className="flex items-center gap-1 hover:text-blue-500"
                >
                  <FontAwesomeIcon icon={faUserEdit} /> Editar
                </button>
                <button
                  onClick={() => toggleBlockUser(user)}
                  className={`flex items-center gap-1 ${
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
          );
        })}
      </div>

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
