"use client"

import type React from "react"
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native"
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer"
import { useTheme } from "../context/ThemeContext"
import { Feather } from "@expo/vector-icons"

interface CustomDrawerContentProps {
  onLogout: () => void
  [key: string]: any
}

const CustomDrawerContent: React.FC<CustomDrawerContentProps> = (props) => {
  const { onLogout, ...restProps } = props
  const { theme, toggleTheme, colors } = useTheme()

  return (
    <DrawerContentScrollView {...restProps} style={{ backgroundColor: colors.card }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Sistema Escolar</Text>
      </View>

      <DrawerItemList
        {...restProps}
        activeTintColor={colors.primary}
        inactiveTintColor={colors.text}
        activeBackgroundColor={theme === "light" ? "#e9ecef" : "#495057"}
      />

      <View style={styles.footer}>
        <View style={styles.themeToggle}>
          <Feather name={theme === "light" ? "sun" : "moon"} size={20} color={colors.text} />
          <Text style={[styles.themeText, { color: colors.text }]}>
            {theme === "light" ? "Modo claro" : "Modo oscuro"}
          </Text>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: "#767577", true: colors.primary }}
            thumbColor={theme === "dark" ? "#f8f9fa" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Feather name="log-out" size={20} color={colors.text} />
          <Text style={[styles.logoutText, { color: colors.text }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  )
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    marginTop: 20,
  },
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  themeText: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 10,
  },
})

export default CustomDrawerContent
