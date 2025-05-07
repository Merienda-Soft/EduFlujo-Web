// data/menuData.ts
import { Menu } from '../../types/menu';
import { getYearManagements } from '../../utils/managementService';
import { managementGlobal } from '../../utils/globalState';
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
<<<<<<< HEAD
    id: 4,
    title: "Tutoria",
    path: "/tutorship",
    roles: ['tutor', 'professor'],
    newTab: false,
  },
  {
    id: 5,
    title: "Academico",
    path: "/academic",
    roles: ['admin'],
    newTab: false,
  },
  {
    id: 6,
    title: "Solicitudes",
=======
    id: 8,
    title: "Tutor",
>>>>>>> 177d2a1f6baf5095fabcfb317226180aced0e02a
    newTab: false,
    roles: ['admin'],
    submenu: [
      {
<<<<<<< HEAD
        id: 61,
=======
        id: 81,
>>>>>>> 177d2a1f6baf5095fabcfb317226180aced0e02a
        title: "Tutores Disponibles",
        path: "/tutor/1",
        newTab: false,
        roles: ['admin']
      },
      {
<<<<<<< HEAD
        id: 62,
=======
        id: 82,
>>>>>>> 177d2a1f6baf5095fabcfb317226180aced0e02a
        title: "Solicitudes Pendientes",
        path: "/tutor/2",
        newTab: false,
        roles: ['admin'] 
      },
      {
<<<<<<< HEAD
        id: 63,
        title: "Solicitudes Rechazadas",
=======
        id: 83,
        title: "Solicitudes Rechazados",
>>>>>>> 177d2a1f6baf5095fabcfb317226180aced0e02a
        path: "/tutor/0",
        newTab: false,
        roles: ['admin'] 
      }
    ]
  },
  {
<<<<<<< HEAD
    id: 7,
=======
    id: 9,
    title: "Academico",
    path: "/academic",
    roles: ['admin'],
    newTab: false,
  },
  {
    id: 10,
    title: "Inicio",
    path: "/management",
    roles: ['admin'],
    newTab: false,
  },
  {
    id: 11,
>>>>>>> 177d2a1f6baf5095fabcfb317226180aced0e02a
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

export const updateMenuDataWithManagements = async (userRoles: string[] = []) => {
  try {
    const managements = await getYearManagements();
    const managementSubmenu = managements.map((management: any) => ({
      id: management.id,
      title: management.management,
      status: management.status,
      path: `/`,
      newTab: false,
      roles: ['admin'] 
    }));

    let updatedMenu = menuData.map((menu) => {
<<<<<<< HEAD
      if (menu.id === 7) {
=======
      if (menu.id === 11) {
>>>>>>> 177d2a1f6baf5095fabcfb317226180aced0e02a
        return {
          ...menu,
          submenu: managementSubmenu,
        };
      }
      return menu;
    });

    updatedMenu = updatedMenu.map((menu) => {
<<<<<<< HEAD
      if (menu.id === 7) {
=======
      if (menu.id === 11) {
>>>>>>> 177d2a1f6baf5095fabcfb317226180aced0e02a
        return {
          ...menu,
          title: `Gestion: ${managementGlobal.year}`,
        };
      }
      return menu;
    });

    // Filtra el menú por roles
    return updatedMenu.filter(menuItem => {
      if (!menuItem.roles) return true;
      return menuItem.roles.some(role => userRoles.includes(role));
    });
  } catch (error) {
    console.error('Error updating menu data with managements:', error);
    return menuData.filter(menuItem => {
      if (!menuItem.roles) return true;
      return menuItem.roles.some(role => userRoles.includes(role));
    });
  }
};

export { menuData };