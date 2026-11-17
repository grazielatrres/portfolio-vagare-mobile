// Metro com o serializer do Sentry: gera os Debug IDs que ligam o bundle aos
// source maps enviados no build, para os erros aparecerem com o código original.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
