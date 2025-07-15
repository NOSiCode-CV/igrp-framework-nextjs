import type { IGRPConfigArgs } from '@igrp/framework-next-types';
type IGRPRootLocaleLayoutArgs = {
    readonly children: React.ReactNode;
    readonly config: Promise<IGRPConfigArgs>;
};
export declare function IGRPRootLayout({ children, config, }: IGRPRootLocaleLayoutArgs): Promise<import("react/jsx-runtime").JSX.Element>;
export {};
