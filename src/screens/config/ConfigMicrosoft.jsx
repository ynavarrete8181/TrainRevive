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
import Constants from "expo-constants";

/**
 * ✅ CONFIGURACIÓN DE LOGIN MICROSOFT GYM ULEAM
 * Compatible con Expo SDK 54+, Android, iOS y Web.
 */

const TENANT_ID = "31a17900-7589-4cfc-b11a-f4e83c27b8ed";
const CLIENT_ID = "a5b318d7-321a-4629-899d-fb0efc94660a";

// 🔹 Redirects según entorno
const expoRedirect = `exp://vecwene-oscar6587-8081.exp.direct`;
const nativeRedirect = "com.uleam.edu.ec.GymUleam://auth";

// 🔹 Intento de descubrimiento automático
const discoveryEndpoint = `https://login.microsoftonline.com/${TENANT_ID}/v2.0/.well-known/openid-configuration`;

// ✅ Fallback manual (si el auto discovery falla)
export const manualDiscovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
  revocationEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/logout`,
};

export const config = {
  clientId: CLIENT_ID,

  // 📡 Usar descubrimiento automático (si responde bien)
  authority: discoveryEndpoint,

  // ✅ Scopes recomendados por Microsoft Graph API
  scopes: ["openid", "profile", "email", "User.Read", "offline_access"],

  // ✅ Redirect dinámico según entorno
  redirectUri:
    Constants.appOwnership === "expo"
      ? expoRedirect // En Expo Go (modo desarrollo)
      : AuthSession.makeRedirectUri({
          native: nativeRedirect, // En build nativa (APK o IPA)
          useProxy: false,
        }),

  // 🚀 Exportamos fallback manual para usar en caso de error
  fallback: manualDiscovery,
};



