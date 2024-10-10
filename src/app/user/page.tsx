import UserList from "../../components/UserManagement/UserList";
import Breadcrumb from "../../components/Common/Breadcrumb";
import CreateUserForm from '../../components/UserManagement/CreateUserForm';

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lista de Usuarios",
};

const User = () => {
  return (
    <>
      <Breadcrumb
        pageName="Lista de Usuarios"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. In varius eros eget sapien consectetur ultrices. Ut quis dapibus libero."
      />
      <CreateUserForm />
      <UserList />
    </>
  );
};

export default User;
