/* export const config = {
    appId: '13e24fa4-9c64-4653-a96c-20964510b52a',
    redirectUri: 'http://localhost:3000',
    scopes: [
        'user.read'
    ],
    authority: 'https://login.microsoftonline.com/31a17900-7589-4cfc-b11a-f4e83c27b8ed'
    
}; */

// src/config/ConfigMicrosoft.jsx
import * as AuthSession from "expo-auth-session";

export const config = {
  appId: "13e24fa4-9c64-4653-a96c-20964510b52a",
  authority: "https://login.microsoftonline.com/31a17900-7589-4cfc-b11a-f4e83c27b8ed",
  scopes: ["User.Read", "openid", "profile", "email"],
  redirectUri: AuthSession.makeRedirectUri({
    native: "com.uleam.edu.ec.GymUleam://auth",
    useProxy: true, // para usar el proxy de Expo durante desarrollo
  }),
};
