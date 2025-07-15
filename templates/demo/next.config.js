import createNextIntlPlugin from 'next-intl/plugin';
const nextConfig = {
    // output: 'standalone',
    basePath: '/apps/contruibuicoes',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'nosi.cv',
            },
            {
                protocol: 'https',
                hostname: 'img.youtube.com',
            },
        ],
    },
};
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
