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
    roles: ['student', 'admin', 'tutor'] 
  },
  {
    id: 2,
    title: "Mis Cursos",
    path: "/professor",
    roles: ['professor'],
    newTab: false,
  },
  {
    id: 4,
    title: "Tutoría",
    path: "/tutorship",
    roles: ['tutor'],
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
    id: 10,
    title: "Inicio",
    path: "/management",
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
      if (menu.id === 11) {
        return {
          ...menu,
          submenu: managementSubmenu,
        };
      }
      return menu;
    });

    updatedMenu = updatedMenu.map((menu) => {
      if (menu.id === 11) {
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