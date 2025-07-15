type ClientRuntimeConfig = {
    token: string;
    baseUrl: string;
    timeout?: number;
};
export declare function setAccessClientConfig(config: ClientRuntimeConfig): void;
export declare function getAccessClientConfig(): ClientRuntimeConfig;
export declare function resetAccessClientConfig(): void;
export {};
