import { Menu } from '../../types/menu';
import { getYearManagements } from '../../utils/managementService';
import { managementGlobal } from '../../utils/globalState';

let menuData: Menu[] = [
  {
    id: 1,
    title: "Home",
    path: "/",
    newTab: false,
  },
  {
    id: 2,
    title: "Cursos",
    path: "/course",
    newTab: false,
  },
  {
    id: 3,
    title: "Profesores",
    path: "/user",
    newTab: false,
  },
  {
    id: 4,
    title: "Soporte",
    path: "/contact",
    newTab: false,
  },
  {
    id: 5,
    title: "Gestion",
    newTab: false,
    submenu: [], // lista de gestiones
  },
];

export const updateMenuDataWithManagements = async () => {
  try {
    const managements = await getYearManagements();
    const managementSubmenu = managements.map((management: any) => ({
      id: management._id,
      title: management.year,
      path: `/management/${management._id}`,
      newTab: false,
    }));

    menuData = menuData.map((menu) => {
      if (menu.id === 5) {
        return {
          ...menu,
          submenu: managementSubmenu,
        };
      }
      return menu;
    });

    menuData = menuData.map((menu) => {
      if (menu.id === 5) {
        return {
          ...menu,
          title: `Gestion: ${managementGlobal.year}`,
        };
      }
      return menu;
    });

    return menuData;
  } catch (error) {
    console.error('Error updating menu data with managements:', error);
    return menuData;
  }
};

export { menuData };