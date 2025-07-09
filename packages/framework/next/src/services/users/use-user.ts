import { getAccessClient } from '../../lib/api-client';
import { mapperUser } from './mapper';

export const fetchCurrentUser = async () => {
  try {
    const client = await getAccessClient();
    const result = await client.users.getCurrentUser();
    const user = mapperUser(result.data);
    return user;
  } catch (error) {
    console.error('Failed to fetch current user data:', error);
    throw error;
  }
};
