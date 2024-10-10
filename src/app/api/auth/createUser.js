import { getAccessToken } from './getAccessToken';
import axios from 'axios';

export const createUser = async (req, res) => {
    const { email, password, name } = req.body;

    try {
        const accessToken = await getAccessToken();

        const response = await axios.post(
            'https://<tu-dominio-de-auth0>/api/v2/users',
            {
                email,
                password,
                name,
                username,
                connection: 'eduflujo', // Tipo de conexión
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error creating user:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error creating user' });
    }
};
