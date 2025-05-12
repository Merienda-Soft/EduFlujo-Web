// data/menuData.ts
import { Menu } from '../../types/menu';
import { getYearManagements } from '../../utils/managementService';
import { getManagementGlobal } from '../../utils/globalState';
import { useUserRoles } from '../../utils/roleUtils';

let menuData: Menu[] = [
  {
    id: 1,
    title: "Home",
    path: "/",
    newTab: false,
    roles: ['admin'] 
  },
  {
    id: 2,
    title: "Mis Cursos",
    path: "/professor",
    roles: ['professor'],
    newTab: false,
  },
  {
    id: 3,
    title: "Cursos",
    path: "/student",
    roles: ['student', 'tutor'],
    newTab: false,
  },
  {
    id: 4,
    title: "Tutoría",
    path: "/tutorship",
    roles: [],
    newTab: false,
  },
  {
    id: 6,
    title: "Cursos",
    path: "/course",
    roles: ['admin'],
    newTab: false,
  },
  {
    id: 7,
    title: "Profesores",
    path: "/user",
    roles: ['admin'],
    newTab: false,
  },
  {
    id: 8,
    title: "Tutor",
    newTab: false,
    roles: ['admin'],
    submenu: [
      {
        id: 81,
        title: "Tutores Disponibles",
        path: "/tutor/1",
        newTab: false,
        roles: ['admin']
      },
      {
        id: 82,
        title: "Solicitudes Pendientes",
        path: "/tutor/2",
        newTab: false,
        roles: ['admin'] 
      },
      {
        id: 83,
        title: "Solicitudes Rechazados",
        path: "/tutor/0",
        newTab: false,
        roles: ['admin'] 
      }
    ]
  },
  {
    id: 9,
    title: "Academico",
    path: "/academic",
    roles: ['admin'],
    newTab: false,
  },
  {
    id: 11,
    title: "Gestion",
    newTab: false,
    roles: ['admin'],
    submenu: [],
  },
  {
    id: 100,
    title: 'Reportes',
    path: '/professor/reports',
    roles: ['professor'],
    newTab: false,
  },
];

export const getUpdatedMenuData = (userRoles: string[] = []) => {
  const { year, allManagements } = getManagementGlobal();

  const managementSubmenu = allManagements.map(management => ({
    id: management.id,
    title: management.management.toString(),
    status: management.status,
    path: '#',
    newTab: false,
    roles: ['admin']
  }));

  return menuData.map(menu => {
    if (menu.id === 11) {
      return {
        ...menu,
        title: `Gestión: ${year || 'Seleccionar'}`,
        submenu: managementSubmenu,
      };
    }
    return menu;
  }).filter(menuItem => 
    !menuItem.roles || menuItem.roles.some(role => userRoles.includes(role))
  );
};

export { menuData };