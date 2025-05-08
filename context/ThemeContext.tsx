"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import { useColorScheme } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

type ThemeType = "light" | "dark"

interface ThemeContextType {
  theme: ThemeType
  toggleTheme: () => void
  colors: {
    background: string
    text: string
    primary: string
    secondary: string
    card: string
    border: string
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceTheme = useColorScheme() as ThemeType
  const [theme, setTheme] = useState<ThemeType>("light")

  useEffect(() => {
    // Load saved theme
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme")
        if (savedTheme) {
          setTheme(savedTheme as ThemeType)
        } else {
          setTheme(deviceTheme || "light")
        }
      } catch (error) {
        console.log("Error loading theme:", error)
      }
    }

    loadTheme()
  }, [deviceTheme])

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    try {
      await AsyncStorage.setItem("theme", newTheme)
    } catch (error) {
      console.log("Error saving theme:", error)
    }
  }

  const lightColors = {
    background: "#ffffff",
    text: "#212529",
    primary: "#6c757d",
    secondary: "#adb5bd",
    card: "#f8f9fa",
    border: "#dee2e6",
  }

  const darkColors = {
    background: "#212529",
    text: "#f8f9fa",
    primary: "#adb5bd",
    secondary: "#6c757d",
    card: "#343a40",
    border: "#495057",
  }

  const colors = theme === "light" ? lightColors : darkColors

  return <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
