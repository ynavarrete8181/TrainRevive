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
const nativeRedirect = "com.uleam.edu.ec.gymuleam://auth"; // esquema real de Android

// 🔹 Descubrimiento automático
const discoveryEndpoint = `https://login.microsoftonline.com/${TENANT_ID}/v2.0/.well-known/openid-configuration`;

// ✅ Fallback manual
export const manualDiscovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
  revocationEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/logout`,
};

/**
 * 🎭 Función auxiliar
 * Transforma temporalmente la URI real (minúscula) para que Microsoft la vea en mayúsculas.
 */
export function patchRedirectForMicrosoft(realRedirect) {
  return realRedirect.replace(
    "com.uleam.edu.ec.gymuleam://auth",
    "com.uleam.edu.ec.GymUleam://auth"
  );
}

export async function forceMicrosoftLogout() {
  try {
    await AuthSession.startAsync({
      authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/logout",
    });
    console.log("✔ Sesión Microsoft limpiada");
  } catch (e) {
    console.log("No se pudo limpiar sesión:", e);
  }
}


/**
 * ✅ Configuración base
 */
export const config = {
  clientId: CLIENT_ID,
  authority: discoveryEndpoint,
  scopes: ["openid", "profile", "email", "User.Read", "offline_access"],

  redirectUri:
    Constants.appOwnership === "expo"
      ? AuthSession.makeRedirectUri({ useProxy: true })
      : AuthSession.makeRedirectUri({
          scheme: "com.uleam.edu.ec.gymuleam",
          path: "auth",
          useProxy: true,
        }),

  fallback: manualDiscovery,
};

/**
 * 🚀 Helper para construir correctamente el authUrl
 * (usado en tu LoginScreen)
 */
export function buildMicrosoftAuthUrl() {
  const redirectUri =
    Constants.appOwnership === "expo"
      ? expoRedirect
      : AuthSession.makeRedirectUri({
          scheme: "com.uleam.edu.ec.gymuleam",
          path: "auth",
          useProxy: false,
        });

  // 🎭 Solo modificamos la salida para Microsoft
  const outgoingRedirect = patchRedirectForMicrosoft(redirectUri);

  const authUrl = `${manualDiscovery.authorizationEndpoint}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    outgoingRedirect
  )}&scope=${encodeURIComponent(
    config.scopes.join(" ")
  )}&response_mode=query&prompt=select_account`;

  console.log("👉 Redirect real:", redirectUri);
  console.log("🎭 Redirect enviado a Microsoft:", outgoingRedirect);
  console.log("🔗 Auth URL final:", authUrl);

  return { authUrl, redirectUri };
}
