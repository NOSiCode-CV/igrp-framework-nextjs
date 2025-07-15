let runtimeConfig = null;
export function setAccessClientConfig(config) {
    runtimeConfig = config;
}
export function getAccessClientConfig() {
    if (!runtimeConfig)
        throw new Error('Access client config not set.');
    return runtimeConfig;
}
export function resetAccessClientConfig() {
    runtimeConfig = null;
}
