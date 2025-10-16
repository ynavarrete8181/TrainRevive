import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";

import LoginScreen from "./src/screens/Auth/LoginScreen";
import HomeScreen from "./src/screens/Home/HomeScreen";
import ReservarScreen from "./src/screens/Reservas/ReservarScreen";
import MisReservasScreen from "./src/screens/Reservas/MisReservasScreen";
import PerfilScreen from "./src/screens/Perfil/PerfilScreen";
import TopBar from "./src/components/TopBar";


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator(); 

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: ({ navigation }) => <TopBar navigation={navigation} />,
        tabBarIcon: ({ color }) => {
          let iconName;
          if (route.name === "Inicio") iconName = "home-outline";
          else if (route.name === "Agendar") iconName = "calendar-outline";
          else if (route.name === "MisTurnos") iconName = "calendar-outline";
          else if (route.name === "Perfil") iconName = "person-outline";
          return <Icon name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: "rgba(20,73,133,1)",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          height: 60,
          paddingBottom: 6,
          borderTopWidth: 0.5,
          borderTopColor: "#ddd",
        },
        tabBarLabelStyle: { fontSize: 12 },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Agendar" component={ReservarScreen} />
      <Tab.Screen name="MisTurnos" component={MisReservasScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem("authToken");
      setIsLoggedIn(!!token);
      setLoading(false);
    };
    checkToken();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login">
            {() => <LoginScreen setIsLoggedIn={setIsLoggedIn} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
