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
    roles: ['student', 'professor', 'admin', 'tutor'] 
  },
  {
    id: 2,
    title: "Cursos",
    path: "/course",
    roles: ['professor', 'admin'],
    newTab: false,
  },
  {
    id: 3,
    title: "Profesores",
    path: "/user",
    roles: ['admin'],
    newTab: false,
  },
  {
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
    newTab: false,
    roles: ['admin'],
    submenu: [
      {
        id: 61,
        title: "Tutores Disponibles",
        path: "/tutor/1",
        newTab: false,
        roles: ['admin']
      },
      {
        id: 62,
        title: "Solicitudes Pendientes",
        path: "/tutor/2",
        newTab: false,
        roles: ['admin'] 
      },
      {
        id: 63,
        title: "Solicitudes Rechazadas",
        path: "/tutor/0",
        newTab: false,
        roles: ['admin'] 
      }
    ]
  },
  {
    id: 7,
    title: "Gestion",
    newTab: false,
    roles: ['admin'],
    submenu: [],
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
      if (menu.id === 7) {
        return {
          ...menu,
          submenu: managementSubmenu,
        };
      }
      return menu;
    });

    updatedMenu = updatedMenu.map((menu) => {
      if (menu.id === 7) {
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