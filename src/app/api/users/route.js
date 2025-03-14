import { getAccessToken } from '../../api/auth/getAccessToken';
import axios from 'axios';

export async function GET(request) {
  const token = await getAccessToken();

  const options = {
    method: 'GET',
    url: `${process.env.AUTH0_AUDIENCE}users`,
    headers: {
      authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await axios.request(options);
    return new Response(JSON.stringify(response.data), {
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
  
  const { email, password, name } = await request.json();

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
    return new Response(JSON.stringify(response.data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating user:', error.response ? error.response.data : error.message);
    return new Response(JSON.stringify({ error: 'Error creating user', details: error.response ? error.response.data : error.message }), {
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