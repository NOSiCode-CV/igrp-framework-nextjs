export function buildQueryString(params) {
    const validParams = Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`);
    return validParams.length > 0 ? `?${validParams.join('&')}` : '';
}
