import { getAccessToken } from '../../api/auth/getAccessToken';
import axios from 'axios';

export async function PATCH(request) {
  const token = await getAccessToken();
  const { user_id, new_password } = await request.json();

  try {
    const options = {
      method: 'PATCH',
      url: `${process.env.AUTH0_AUDIENCE}users/${user_id}`,
      headers: {
        authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        password: new_password,
        connection: 'eduflujo',
      },
    };

    await axios.request(options);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error cambiando la Contraseña:', error);
    return new Response(JSON.stringify({ 
      error: 'Error cambiando la Contraseña',
      details: error.response?.data || error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}