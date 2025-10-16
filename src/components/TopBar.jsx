import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TopBar = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Logo */}
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
        />

        {/* Imagen de perfil */}
        <TouchableOpacity onPress={() => navigation.navigate("Perfil")}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "rgba(20,73,133,1)",
  },
  container: {
    backgroundColor: "rgba(20,73,133,1)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logo: {
    width: 100,
    height: 40,
    resizeMode: "contain",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fff",
  },
});

export default TopBar;
