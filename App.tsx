"use client"

import { useState, useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createDrawerNavigator } from "@react-navigation/drawer"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import AsyncStorage from "@react-native-async-storage/async-storage"

import LoginScreen from "./screens/LoginScreen"
import ActivitiesScreen from "./screens/ActivitiesScreen"
import ManagementScreen from "./screens/ManagementScreen"
import ScheduleScreen from "./screens/ScheduleScreen"
import StatisticsScreen from "./screens/StatisticsScreen"
import CustomDrawerContent from "./components/CustomDrawerContent"
import { ThemeProvider } from "./context/ThemeContext"
import { DataProvider } from "./context/DataContext"
import { useTheme } from "./context/ThemeContext"

const Drawer = createDrawerNavigator()
const Stack = createNativeStackNavigator()

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = async () => {
      try {
        const value = await AsyncStorage.getItem("isLoggedIn")
        if (value === "true") {
          setIsLoggedIn(true)
        }
      } catch (error) {
        console.log("Error checking login status:", error)
      }
    }

    checkLoginStatus()
  }, [])

  const handleLogin = async () => {
    try {
      await AsyncStorage.setItem("isLoggedIn", "true")
      setIsLoggedIn(true)
    } catch (error) {
      console.log("Error setting login status:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("isLoggedIn")
      setIsLoggedIn(false)
    } catch (error) {
      console.log("Error removing login status:", error)
    }
  }

  function DrawerNavigator() {
    const { theme, colors } = useTheme()
    return (
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} onLogout={handleLogout} />}
        screenOptions={({ navigation }) => ({
          headerStyle: {
            backgroundColor: theme === "light" ? "#6c757d" : "#212529",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            color: "#ffffff",
          },
          drawerActiveTintColor: "#6c757d",
          drawerInactiveTintColor: "#adb5bd",
          drawerStyle: {
            backgroundColor: colors.card,
            width: 240,
          },
        })}
      >
        <Drawer.Screen name="Actividades" component={ActivitiesScreen} />
        <Drawer.Screen name="Gestión" component={ManagementScreen} />
        <Drawer.Screen name="Horarios" component={ScheduleScreen} />
        <Drawer.Screen name="Estadísticas" component={StatisticsScreen} />
      </Drawer.Navigator>
    )
  }

  return (
    <ThemeProvider>
      <DataProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          {isLoggedIn ? (
            <DrawerNavigator />
          ) : (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login">{(props) => <LoginScreen {...props} onLogin={handleLogin} />}</Stack.Screen>
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </DataProvider>
    </ThemeProvider>
  )
}
 