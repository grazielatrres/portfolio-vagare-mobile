import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const reversedClientIdScheme = `com.googleusercontent.apps.${clientId.replace('.apps.googleusercontent.com', '')}`;

export function useGoogleAuth() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: reversedClientIdScheme });

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery,
  );

  async function signInWithGoogle(): Promise<string> {
    if (!request) {
      throw new Error('Login com Google ainda não está pronto. Tente novamente.');
    }

    const result = await promptAsync();

    if (result.type !== 'success') {
      throw new Error('Login com Google cancelado.');
    }

    const tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        clientId,
        code: result.params.code,
        redirectUri,
        extraParams: {
          code_verifier: request.codeVerifier ?? '',
        },
      },
      discovery,
    );

    if (!tokenResponse.idToken) {
      throw new Error('Não foi possível obter o token do Google.');
    }

    return tokenResponse.idToken;
  }

  return { signInWithGoogle, isReady: !!request };
}
