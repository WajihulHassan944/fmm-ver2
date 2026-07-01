import { GoogleOAuthProvider } from '@react-oauth/google';

export const GOOGLE_OAUTH_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ||
  '261076841125-1n3ps24u5fco1js6o1u212nac7agp9dg.apps.googleusercontent.com';

const GoogleOAuthBoundary = ({ children }) => {
  if (!GOOGLE_OAUTH_CLIENT_ID) return children;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_OAUTH_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
};

export default GoogleOAuthBoundary;
