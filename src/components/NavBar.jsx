// src/components/NavBar.jsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TopBar from "./TopBar";

// 🧩 Pantallas principales
import HomeScreen from "../screens/Home/HomeScreen";
import ReservarScreen from "../screens/Reservas/ReservarScreen";
import MisReservasScreen from "../screens/Reservas/MisReservasScreen";
import PerfilScreen from "../screens/Perfil/PerfilScreen";

const Tab = createBottomTabNavigator();

const NavBar = ({ setIsLoggedIn }) => {
  const insets = useSafeAreaInsets(); // 👈 márgenes seguros

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: ({ navigation }) => <TopBar navigation={navigation} />,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          switch (route.name) {
            case "Inicio":
              iconName = "home";
              break;
            case "Agendar":
              iconName = focused ? "calendar-check" : "calendar-alt";
              break;
            case "Mis Turnos":
              iconName = "list";
              break;
            case "Perfil":
              iconName = focused ? "user-circle" : "user";
              break;
            default:
              iconName = "circle";
          }
          return (
            <FontAwesome5
              name={iconName}
              size={size}
              color={color}
              solid={focused}
            />
          );
        },
        tabBarActiveTintColor: "rgba(20,73,133,1)",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          height: 60 + insets.bottom, // 👈 se ajusta automáticamente
          paddingBottom: insets.bottom > 0 ? insets.bottom / 2 : 6,
          borderTopWidth: 0.5,
          borderTopColor: "#ddd",
          backgroundColor: "#fff",
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ title: "Inicio" }}
      />
      <Tab.Screen
        name="Agendar"
        component={ReservarScreen}
        options={{ title: "Agendar" }}
      />
      <Tab.Screen
        name="Mis Turnos"
        component={MisReservasScreen}
        options={{ title: "Mis Turnos" }}
      />
      <Tab.Screen
        name="Perfil"
        children={(props) => (
          <PerfilScreen {...props} setIsLoggedIn={setIsLoggedIn} />
        )}
        options={{ title: "Perfil" }}
      />
    </Tab.Navigator>
  );
};

export default NavBar;
