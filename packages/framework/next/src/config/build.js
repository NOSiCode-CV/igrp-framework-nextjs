// TODO: create Sanitizer for config
export async function buildConfig(config) {
    if (!config)
        throw new Error('IGRP config not initialized.');
    return config;
}
