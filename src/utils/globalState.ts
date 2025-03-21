export let managementGlobal: any = null;

export const setManagementGlobal = (data: any) => {
  managementGlobal = data;
  sessionStorage.setItem('managementGlobal', JSON.stringify(managementGlobal));
};

// Inicializar managementGlobal con el año actual o desde sessionStorage
const currentYear = new Date().getFullYear();
const storedManagementGlobal = sessionStorage.getItem('managementGlobal');
managementGlobal = storedManagementGlobal ? JSON.parse(storedManagementGlobal) : { year: currentYear };