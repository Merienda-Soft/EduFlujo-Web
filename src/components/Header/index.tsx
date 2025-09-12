// components/Header.tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggler from "./ThemeToggler";
import { useUser } from "@auth0/nextjs-auth0/client"; 
import { destroyCookie } from 'nookies';
import { useUserRoles } from '../../utils/roleUtils';
import { getUpdatedMenuData, HeaderIcons } from "./menuData";
import { getManagementGlobal, subscribe, setManagementGlobal, initializeManagement, getUserIdByEmail, clearUserData, resetInitialization } from '../../utils/globalState';
import UserProfileModal from "../UserManagement/UserProfile";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';


const Header = () => {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [openIndex, setOpenIndex] = useState(-1);
  const [menuData, setMenuData] = useState(getUpdatedMenuData());
  
  const { user, isLoading } = useUser();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { hasRole, roles } = useUserRoles();
  const pathname = usePathname();

  useEffect(() => {
    const handleStickyNavbar = () => {
      setSticky(window.scrollY >= 80);
    };
    window.addEventListener("scroll", handleStickyNavbar);
    return () => window.removeEventListener("scroll", handleStickyNavbar);
  }, []);

  useEffect(() => {
    const init = async () => {
      // Solo inicializar managements si hay usuario autenticado o si es la primera vez
      if (!isLoading && (user || getManagementGlobal().allManagements.length === 0)) {
        await initializeManagement();
      }
    };
    init();

    const unsubscribe = subscribe(() => {
      setMenuData(getUpdatedMenuData(roles));
    });
    
    return unsubscribe;
  }, [isLoading, user, roles]);

  // useEffect para manejar la autenticación del usuario
  useEffect(() => {
    const handleUserAuth = async () => {
      // Solo proceder si el estado de carga ha terminado
      if (isLoading) return;
      
      if (user && user.email) {
        // Usuario autenticado: obtener su ID solo si no lo tenemos
        try {
          await getUserIdByEmail(user.email);
        } catch (error) {
          console.error('Error inicializando userId:', error);
        }
      } else {
        // Usuario no autenticado: limpiar datos
        clearUserData();
      }
    };
    
    handleUserAuth();
  }, [isLoading, user?.email]); // Solo depender de isLoading y email específico

  const navbarToggleHandler = () => setNavbarOpen(!navbarOpen);
  
  const handleSubmenu = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  const handleLogout = () => {
    // Limpiar datos del usuario del estado global
    clearUserData();
    // Resetear el flag de inicialización para permitir nueva inicialización si es necesario
    resetInitialization();
    // Limpiar cookies
    destroyCookie(null, 'cookie_name', { path: '/' }); 
    destroyCookie(null, 'another_cookie_name', { path: '/' });
    // Limpiar cookie de management global
    destroyCookie(null, 'managementGlobal', { path: '/' });
    // Redirigir al logout de Auth0
    window.location.href = '/api/auth/logout';
  };

  const handleSubmenuSelect = (title: string) => {
  const { allManagements } = getManagementGlobal();
  const management = allManagements.find(m => 
    m.management.toString() === title
  );
  
  if (management) {
    setManagementGlobal({
      id: management.id,
      year: management.management,
      status: management.status,
      currentManagement: management
    });
    
    window.dispatchEvent(new CustomEvent('management-changed', {
      detail: { managementId: management.id }
    }));
  }
};

  const filteredMenuData = menuData.filter(menuItem => {
    if (!menuItem.roles) return true;
    return hasRole(menuItem.roles);
  });

  return (
    <>
      <header className={`header left-0 top-0 z-40 flex w-full items-center ${
        sticky ? "dark:bg-gray-dark dark:shadow-sticky-dark fixed z-[9999] bg-white !bg-opacity-80 shadow-sticky backdrop-blur-sm transition"
              : "absolute bg-transparent"}`}>
        <div className="container">
          <div className="relative -mx-4 flex items-center justify-between">
            <div className="w-60 max-w-full px-4 xl:mr-12">
               <Link href="/" className={`header-logo block w-full ${
                sticky ? "py-5 lg:py-2" : "py-8"}`}>
                <Image
                  src="/images/logo/logo_edu2.png"
                  alt="logo"
                  width={140}
                  height={100}
                  className="w-full dark:hidden"
                />
                <Image
                  src="/images/logo/logo_edu1.png"
                  alt="logo"
                  width={140}
                  height={100}
                  className="hidden w-full dark:block"
                />
              </Link>
            </div>
            
            <div className="flex w-full items-center justify-between px-4">
              <div>
                <button
                  onClick={navbarToggleHandler}
                  id="navbarToggler"
                  aria-label="Mobile Menu"
                  className="absolute right-4 top-1/2 block translate-y-[-50%] rounded-lg px-3 py-[6px] ring-primary focus:ring-2 lg:hidden"
                >
                  <span className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                    navbarOpen ? " top-[7px] rotate-45" : " "}`} />
                  <span className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                    navbarOpen ? "opacity-0 " : " "}`} />
                  <span className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                    navbarOpen ? " top-[-8px] -rotate-45" : " "}`} />
                </button>
                  <nav id="navbarCollapse" className={`navbar absolute right-0 z-30 w-[250px] rounded border-[.5px] border-body-color/50 bg-white px-6 py-4 duration-300 dark:border-body-color/20 dark:bg-dark lg:visible lg:static lg:w-auto lg:border-none lg:!bg-transparent lg:p-0 lg:opacity-100 ${
                    navbarOpen ? "visibility top-full opacity-100" : "invisible top-[120%] opacity-0"
                  }`}>
                    <ul className="block lg:flex lg:space-x-12">
                      {!isLoading && !user && (
                        <Link href="/tutor" className="btn btn-primary">
                          Solicitar Tutoria
                        </Link>
                      )}
                      
                      {!isLoading && user && filteredMenuData.map((menuItem, index) => (
                        <li key={menuItem.id} className="group relative">
                          {menuItem.path && !menuItem.submenu ? (
                            <Link
                              href={menuItem.path}
                              className={`flex py-2 text-base lg:mr-0 lg:inline-flex lg:px-0 lg:py-6 ${
                                pathname === menuItem.path
                                  ? "text-primary dark:text-white"
                                  : "text-dark hover:text-primary dark:text-white/70 dark:hover:text-white"
                              }`}
                            >
                              {menuItem.title}
                            </Link>
                          ) : (
                            <>
                              <p
                                onClick={() => handleSubmenu(index)}
                                className="flex cursor-pointer items-center justify-between py-2 text-base text-dark group-hover:text-primary dark:text-white/70 dark:group-hover:text-white lg:mr-0 lg:inline-flex lg:px-0 lg:py-6"
                              >
                                {menuItem.title}
                                <span className="pl-3">
                                  <svg width="25" height="24" viewBox="0 0 25 24">
                                    <path
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                      d="M6.29289 8.8427C6.68342 8.45217 7.31658 8.45217 7.70711 8.8427L12 13.1356L16.2929 8.8427C16.6834 8.45217 17.3166 8.45217 17.7071 8.8427C18.0976 9.23322 18.0976 9.86639 17.7071 10.2569L12 15.964L6.29289 10.2569C5.90237 9.86639 5.90237 9.23322 6.29289 8.8427Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                </span>
                              </p>
                              <div
                                className={`submenu relative left-0 top-full rounded-sm bg-white transition-[top] duration-300 group-hover:opacity-100 dark:bg-dark lg:invisible lg:absolute lg:top-[110%] lg:block lg:w-[250px] lg:p-4 lg:opacity-0 lg:shadow-lg lg:group-hover:visible lg:group-hover:top-full ${
                                  openIndex === index ? "block" : "hidden"
                                }`}
                              >
                                {menuItem.submenu?.filter(subItem => 
                                  !subItem.roles || hasRole(subItem.roles)
                                ).map((submenuItem) => (
                                  <Link
                                    key={submenuItem.id}
                                    href={submenuItem.path}
                                    className="block rounded py-2.5 text-sm text-dark hover:text-primary dark:text-white/70 dark:hover:text-white lg:px-3"
                                    onClick={() => handleSubmenuSelect(submenuItem.title)}
                                  >
                                    {submenuItem.title}
                                  </Link>
                                ))}
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </nav>
              </div>

              <div className="flex items-center justify-end pr-16 lg:pr-0">
                <HeaderIcons />
                <ThemeToggler />
                {!isLoading && !user && (
                  <Link href="/api/auth/login" className="btn btn-primary">
                    Iniciar Sesion
                  </Link>
                )}
                {!isLoading && user && (
                  <div className="flex items-center space-x-4">
                    
                    <div className="relative w-10 h-10">
                      <img
                        src={user.picture}
                        alt="Profile"
                        className="rounded-full w-full h-full object-cover"
                      />
                      
                      <button 
                        onClick={() => setShowProfileModal(true)}
                        className="absolute -top-2 -right-2 rounded-full shadow hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        aria-label="Perfil de usuario"
                        title="Editar perfil"
                      >
                        <FontAwesomeIcon icon={faPencilAlt} className="w-5 h-5" />
                      </button>
                    </div>

                    <button onClick={handleLogout} className="btn btn-danger">
                      Cerrar Sesión
                    </button>
                  </div>
                )}

                {showProfileModal && (
                  <UserProfileModal 
                    onClose={() => setShowProfileModal(false)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;