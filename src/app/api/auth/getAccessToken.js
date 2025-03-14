import axios from 'axios';

let cachedToken = null;
let tokenExpiration = null;

export async function getAccessToken() {
  if (cachedToken && tokenExpiration > Date.now()) {
    return cachedToken;
  }

  const options = {
    method: 'POST',
    url: `${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`,
    headers: { 'content-type': 'application/json' },
    data: {
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: process.env.AUTH0_AUDIENCE,
      grant_type: 'client_credentials',
    },
  };

  try {
    const response = await axios.request(options);
    cachedToken = response.data.access_token;
    tokenExpiration = Date.now() + (response.data.expires_in * 1000); 
    return cachedToken;
  } catch (error) {
    console.error('Error obtaining access token', error);
    throw error;
  }
}
