// projectId: defina EAS_PROJECT_ID no .env (local) ou use o build na nuvem (EAS_BUILD_PROJECT_ID).
module.exports = ({ config }) => {
  const projectId =
    process.env.EAS_PROJECT_ID || process.env.EAS_BUILD_PROJECT_ID;

  return {
    ...config,
    extra: {
      ...config.extra,
      eas: {
        ...config.extra?.eas,
        ...(projectId ? { projectId } : {}),
      },
    },
  };
};
