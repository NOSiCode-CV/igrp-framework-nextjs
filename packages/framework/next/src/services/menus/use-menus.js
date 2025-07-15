import { getAccessClient } from '../../lib/api-client';
import { mapperMenus } from './mapper';
export const fetchMenus = async (appCode) => {
    try {
        const client = await getAccessClient();
        const result = await client.menus.getMenus({ applicationId: appCode });
        const menus = mapperMenus(result);
        return menus;
    }
    catch (error) {
        console.error('Failed to fetch menus data:', error);
        throw error;
    }
};
