"use client"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { useData } from "../context/DataContext"
import { Feather } from "@expo/vector-icons"
import * as Print from "expo-print"
import * as Sharing from "expo-sharing"

const StatisticsScreen = () => {
  const { colors } = useTheme()
  const { docentes, materias, grupos, directivos, horarios } = useData()

  const stats = [
    { title: "Docentes", count: docentes.length, icon: "users" },
    { title: "Materias", count: materias.length, icon: "book" },
    { title: "Grupos", count: grupos.length, icon: "layers" },
    { title: "Directivos", count: directivos.length, icon: "briefcase" },
    { title: "Horarios", count: horarios.length, icon: "clock" },
  ]

  const generateDocentesPDF = async () => {
    try {
      if (docentes.length === 0) {
        Alert.alert("Error", "No hay docentes para generar el PDF")
        return
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: letter;
              margin: 10mm;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 10px;
              max-width: 100%;
              margin: 0;
            }
            h1 {
              font-size: 18px;
              text-align: center;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: #f4f4f4;
              font-weight: bold;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <p style="font-size: 14px; margin: 0; font-weight: bold;">COLEGIO DE BACHILLERES DEL ESTADO DE VERACRUZ</p>
            <p style="font-size: 12px; margin: 3px 0; font-weight: normal;">ORGANISMO PUBLICO DESCENTRALIZADO</p>
            <p style="font-size: 13px; margin: 3px 0; font-weight: normal;">PLANTEL 18 - COATZACOALCOS</p>
          </div>
          <h1>Lista de Docentes</h1>
          <table>
            <tr>
              <th>#</th>
              <th>Nombre Completo</th>
              <th>Email</th>
              <th>Número de Empleado</th>
            </tr>
            ${docentes
              .map(
                (docente, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${docente.nombre} ${docente.apellido}</td>
                <td>${docente.email}</td>
                <td>${docente.numeroEmpleado}</td>
              </tr>
            `,
              )
              .join("")}
          </table>
        </body>
        </html>
      `

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      })

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartir lista de docentes",
        UTI: "com.adobe.pdf",
      })
    } catch (error) {
      console.error("Error al generar PDF:", error)
      Alert.alert("Error", "No se pudo generar el PDF. Intenta de nuevo.")
    }
  }

  const generateMateriasPDF = async () => {
    try {
      if (materias.length === 0) {
        Alert.alert("Error", "No hay materias para generar el PDF")
        return
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: letter;
              margin: 10mm;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 10px;
              max-width: 100%;
              margin: 0;
            }
            h1 {
              font-size: 18px;
              text-align: center;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: #f4f4f4;
              font-weight: bold;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <p style="font-size: 14px; margin: 0; font-weight: bold;">COLEGIO DE BACHILLERES DEL ESTADO DE VERACRUZ</p>
            <p style="font-size: 12px; margin: 3px 0; font-weight: normal;">ORGANISMO PUBLICO DESCENTRALIZADO</p>
            <p style="font-size: 13px; margin: 3px 0; font-weight: normal;">PLANTEL 18 - COATZACOALCOS</p>
          </div>
          <h1>Lista de Materias</h1>
          <table>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Siglas</th>
            </tr>
            ${materias
              .map(
                (materia, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${materia.nombre}</td>
                <td>${materia.siglas}</td>
              </tr>
            `,
              )
              .join("")}
          </table>
        </body>
        </html>
      `

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      })

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartir lista de materias",
        UTI: "com.adobe.pdf",
      })
    } catch (error) {
      console.error("Error al generar PDF:", error)
      Alert.alert("Error", "No se pudo generar el PDF. Intenta de nuevo.")
    }
  }

  const generateGruposPDF = async () => {
    try {
      if (grupos.length === 0) {
        Alert.alert("Error", "No hay grupos para generar el PDF")
        return
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: letter;
              margin: 10mm;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 10px;
              max-width: 100%;
              margin: 0;
            }
            h1 {
              font-size: 18px;
              text-align: center;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: #f4f4f4;
              font-weight: bold;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <p style="font-size: 14px; margin: 0; font-weight: bold;">COLEGIO DE BACHILLERES DEL ESTADO DE VERACRUZ</p>
            <p style="font-size: 12px; margin: 3px 0; font-weight: normal;">ORGANISMO PUBLICO DESCENTRALIZADO</p>
            <p style="font-size: 13px; margin: 3px 0; font-weight: normal;">PLANTEL 18 - COATZACOALCOS</p>
          </div>
          <h1>Lista de Grupos</h1>
          <table>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Docente</th>
            </tr>
            ${grupos
              .map((grupo, index) => {
                const docente = docentes.find((d) => d.id === grupo.docenteId)
                const docenteNombre = docente ? `${docente.nombre} ${docente.apellido}` : "No asignado"

                return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${grupo.nombre}</td>
                  <td>${docenteNombre}</td>
                </tr>
              `
              })
              .join("")}
          </table>
        </body>
        </html>
      `

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      })

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartir lista de grupos",
        UTI: "com.adobe.pdf",
      })
    } catch (error) {
      console.error("Error al generar PDF:", error)
      Alert.alert("Error", "No se pudo generar el PDF. Intenta de nuevo.")
    }
  }

  const generateDirectivosPDF = async () => {
    try {
      if (directivos.length === 0) {
        Alert.alert("Error", "No hay directivos para generar el PDF")
        return
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: letter;
              margin: 10mm;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 10px;
              max-width: 100%;
              margin: 0;
            }
            h1 {
              font-size: 18px;
              text-align: center;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: #f4f4f4;
              font-weight: bold;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <p style="font-size: 14px; margin: 0; font-weight: bold;">COLEGIO DE BACHILLERES DEL ESTADO DE VERACRUZ</p>
            <p style="font-size: 12px; margin: 3px 0; font-weight: normal;">ORGANISMO PUBLICO DESCENTRALIZADO</p>
            <p style="font-size: 13px; margin: 3px 0; font-weight: normal;">PLANTEL 18 - COATZACOALCOS</p>
          </div>
          <h1>Lista de Directivos</h1>
          <table>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Puesto</th>
            </tr>
            ${directivos
              .map((directivo, index) => {
                const puesto =
                  directivo.rol === "Director"
                    ? directivo.generoFemenino
                      ? "Directora"
                      : "Director"
                    : directivo.generoFemenino
                      ? "Subdirectora Académica"
                      : "Subdirector Académico"

                return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${directivo.nombre}</td>
                  <td>${puesto}</td>
                </tr>
              `
              })
              .join("")}
          </table>
        </body>
        </html>
      `

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      })

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartir lista de directivos",
        UTI: "com.adobe.pdf",
      })
    } catch (error) {
      console.error("Error al generar PDF:", error)
      Alert.alert("Error", "No se pudo generar el PDF. Intenta de nuevo.")
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={stat.icon} size={30} color={colors.primary} />
              <Text style={[styles.statCount, { color: colors.text }]}>{stat.count}</Text>
              <Text style={[styles.statTitle, { color: colors.secondary }]}>{stat.title}</Text>
            </View>
          ))}
        </View>

        <View style={styles.reportsContainer}>
          <Text style={[styles.reportsTitle, { color: colors.text }]}>Reportes</Text>

          <TouchableOpacity
            style={[styles.reportButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={generateDocentesPDF}
          >
            <Feather name="users" size={20} color={colors.primary} />
            <Text style={[styles.reportButtonText, { color: colors.text }]}>Imprimir Lista de Docentes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reportButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={generateMateriasPDF}
          >
            <Feather name="book" size={20} color={colors.primary} />
            <Text style={[styles.reportButtonText, { color: colors.text }]}>Imprimir Lista de Materias</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reportButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={generateGruposPDF}
          >
            <Feather name="layers" size={20} color={colors.primary} />
            <Text style={[styles.reportButtonText, { color: colors.text }]}>Imprimir Lista de Grupos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reportButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={generateDirectivosPDF}
          >
            <Feather name="briefcase" size={20} color={colors.primary} />
            <Text style={[styles.reportButtonText, { color: colors.text }]}>Imprimir Lista de Directivos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
  },
  statCount: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 5,
  },
  statTitle: {
    fontSize: 14,
  },
  reportsContainer: {
    marginTop: 10,
  },
  reportsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  reportButtonText: {
    fontSize: 16,
    marginLeft: 10,
  },
})

export default StatisticsScreen
