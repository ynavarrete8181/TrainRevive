import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome5 } from "@expo/vector-icons"; // o "react-native-vector-icons/FontAwesome5"
import TopBar from "./TopBar";

// Pantallas
import HomeScreen from "../screens/Home/HomeScreen";
import MisReservasScreen from "../screens/Reservas/MisReservasScreen";
import ReservasScreen from "../screens/Reservas/ReservasScreen";
import PerfilScreen from "../screens/Perfil/PerfilScreen";

const Tab = createBottomTabNavigator();

const NavBar = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: ({ navigation }) => <TopBar navigation={navigation} />,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;

          switch (route.name) {
            case "Inicio":
              iconName = focused ? "home" : "home";
              break;
            case "MisReservas":
              iconName = focused ? "calendar-check" : "calendar-alt";
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
          height: 60,
          paddingBottom: 6,
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
        name="MisTurnos"
        component={MisReservasScreen}
        options={{ title: "Mis Turnos" }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{ title: "Perfil" }}
      />
    </Tab.Navigator>
  );
};

export default NavBar;
