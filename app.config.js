// projectId: defina EAS_PROJECT_ID no .env (local) ou use o build na nuvem (EAS_BUILD_PROJECT_ID).
// Sentry: o plugin configura o SDK nativo e envia os source maps a cada build de loja,
// usando o SENTRY_AUTH_TOKEN das variáveis do EAS (nunca versionado).
module.exports = ({ config }) => {
  const projectId =
    process.env.EAS_PROJECT_ID || process.env.EAS_BUILD_PROJECT_ID;

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      [
        '@sentry/react-native/expo',
        {
          url: 'https://sentry.io/',
          organization: 'vagare-app',
          project: 'vagare-mobile',
        },
      ],
    ],
    extra: {
      ...config.extra,
      eas: {
        ...config.extra?.eas,
        ...(projectId ? { projectId } : {}),
      },
    },
  };
};
