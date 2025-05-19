import { getAccessToken } from '../../api/auth/getAccessToken';
import pLimit from 'p-limit';
import axios from 'axios';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const emails = searchParams.get('emails');

  const token = await getAccessToken();

  if (!emails) {
    return new Response(JSON.stringify({ error: 'Emails parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const emailList = emails.split(',').map(email => email.trim().toLowerCase());

  try {
    const options = {
      method: 'GET',
      url: `${process.env.AUTH0_AUDIENCE}users`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      params: {
        q: `email:("${emailList.join('" OR "')}")`,
        search_engine: 'v3',
      },
    };

    const response = await axios.request(options);
    const filteredUsers = response.data;

    // Función auxiliar con retry
    async function fetchUserRoles(userId, token) {
      try {
        const roleResponse = await axios.get(`${process.env.AUTH0_AUDIENCE}users/${userId}/roles`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        return roleResponse.data.map(role => role.description);
      } catch (error) {
        console.warn(`Fallo al obtener roles para ${userId}. Reintentando...`);

        try {
          await new Promise(res => setTimeout(res, 1000));
          const retryResponse = await axios.get(`${process.env.AUTH0_AUDIENCE}users/${userId}/roles`, {
            headers: {
              authorization: `Bearer ${token}`,
            },
          });
          return retryResponse.data.map(role => role.description);
        } catch (retryError) {
          console.error(`Fallo persistente al obtener roles para ${userId}`, retryError.message);
          return [];
        }
      }
    }

    const limit = pLimit(4);

    const usersWithRoles = await Promise.all(
      filteredUsers.map(user =>
        limit(async () => ({
          ...user,
          roles: await fetchUserRoles(user.user_id, token),
        }))
      )
    );

    return new Response(JSON.stringify(usersWithRoles), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error listing users:', error);
    return new Response(JSON.stringify({ error: 'Error retrieving users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


export async function POST(request) {
  const token = await getAccessToken();
  const { email, password, name, role } = await request.json(); 

  if (role !== 'professor' && role !== 'coordinator') {
    return new Response(JSON.stringify({ error: 'Rol inválido. Debe ser "professor" o "coordinator"' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const options = {
    method: 'POST',
    url: `${process.env.AUTH0_AUDIENCE}users`,
    headers: {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      email,
      password,
      name,
      connection: 'eduflujo',
      user_metadata: {
        temporaryPassword: password,
      },
    },
  };

  try {
    const response = await axios.request(options);
    const userId = response.data.user_id;

    const roleId = role === 'professor' 
      ? process.env.AUTH0_PROFESSOR_ROLE_ID 
      : process.env.AUTH0_COORDINATOR_ROLE_ID;

    const assignRoleOptions = {
      method: 'POST',
      url: `${process.env.AUTH0_AUDIENCE}users/${userId}/roles`,
      headers: {
        authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        roles: [roleId], 
      },
    };

    await axios.request(assignRoleOptions);

    return new Response(JSON.stringify(response.data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creando el usuario o asignando rol:', error.response ? error.response.data : error.message);
    return new Response(JSON.stringify({ 
      error: 'Error creando el usuario o asignando rol', 
      details: error.response ? error.response.data : error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PATCH(request) {
  const token = await getAccessToken();
  const { user_id, name, email, blocked } = await request.json();

  const options = {
    method: 'PATCH',
    url: `${process.env.AUTH0_AUDIENCE}users/${user_id}`,
    headers: {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      name,
      email,
      blocked,
    },
  };

  try {
    const response = await axios.request(options);
    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return new Response(JSON.stringify({ error: 'Error updating user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}