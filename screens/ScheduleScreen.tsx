"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { useData, type Docente, type Grupo, type Horario } from "../context/DataContext"
import { Feather } from "@expo/vector-icons"
import * as Print from "expo-print"
import * as Sharing from "expo-sharing"

const ScheduleScreen = () => {
  const { colors, theme } = useTheme()
  const { docentes, materias, grupos, directivos, horarios, addHorario, updateHorario, deleteHorario } = useData()

  const [currentTab, setCurrentTab] = useState("docentes")
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [fullScreenMode, setFullScreenMode] = useState(false)
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null)

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

  const bloquesHorarios = [
    { horaInicio: "07:00", horaFin: "07:50", esReceso: false },
    { horaInicio: "07:50", horaFin: "08:40", esReceso: false },
    { horaInicio: "08:40", horaFin: "09:30", esReceso: false },
    { horaInicio: "09:30", horaFin: "10:00", esReceso: true },
    { horaInicio: "10:00", horaFin: "10:50", esReceso: false },
    { horaInicio: "10:50", horaFin: "11:40", esReceso: false },
    { horaInicio: "11:40", horaFin: "12:30", esReceso: false },
    { horaInicio: "12:30", horaFin: "13:20", esReceso: false },
    { horaInicio: "13:30", horaFin: "14:20", esReceso: false },
    { horaInicio: "14:20", horaFin: "15:10", esReceso: false },
    { horaInicio: "15:10", horaFin: "16:00", esReceso: false },
    { horaInicio: "16:00", horaFin: "16:30", esReceso: true },
    { horaInicio: "16:30", horaFin: "17:20", esReceso: false },
    { horaInicio: "17:20", horaFin: "18:10", esReceso: false },
    { horaInicio: "18:00", horaFin: "19:00", esReceso: false },
    { horaInicio: "19:00", horaFin: "19:50", esReceso: false },
  ]

  const convertirHoraAMinutos = (hora: string) => {
    const [horas, minutos] = hora.split(":").map(Number)
    return horas * 60 + minutos
  }

  const handleCellPress = (dia: string, bloque: { horaInicio: string; horaFin: string; esReceso: boolean }) => {
    if (bloque.esReceso || !selectedEntity || !selectedMateria) {
      if (!selectedMateria && !bloque.esReceso && selectedEntity) {
        Alert.alert("Seleccione una materia", "Por favor seleccione una materia antes de asignar un horario.")
      }
      return
    }

    // Buscar si ya existe un horario para esta celda
    const horarioExistente = horarios.find(
      (h) =>
        h.dia === dia &&
        h.horaInicio === bloque.horaInicio &&
        h.horaFin === bloque.horaFin &&
        (currentTab === "docentes" ? h.docenteId === selectedEntity : h.salonId === selectedEntity),
    )

    if (horarioExistente) {
      // Actualizar horario existente
      updateHorario(horarioExistente.id, {
        ...horarioExistente,
        materiaId: selectedMateria,
      })
    } else {
      // Crear nuevo horario
      addHorario({
        dia,
        horaInicio: bloque.horaInicio,
        horaFin: bloque.horaFin,
        materiaId: selectedMateria,
        docenteId: currentTab === "docentes" ? selectedEntity : "",
        salonId: currentTab === "grupos" ? selectedEntity : "",
      })
    }
  }

  const handleDeleteHorario = (dia: string, bloque: { horaInicio: string; horaFin: string; esReceso: boolean }) => {
    if (bloque.esReceso || !selectedEntity) return

    const horarioExistente = horarios.find(
      (h) =>
        h.dia === dia &&
        h.horaInicio === bloque.horaInicio &&
        h.horaFin === bloque.horaFin &&
        (currentTab === "docentes" ? h.docenteId === selectedEntity : h.salonId === selectedEntity),
    )

    if (horarioExistente) {
      Alert.alert(
        "Eliminar horario",
        "¿Está seguro de que desea eliminar este horario?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => {
              deleteHorario(horarioExistente.id)
            },
          },
        ],
        { cancelable: true },
      )
    }
  }

  const generateGroupSchedules = () => {
    // Confirmar antes de generar
    Alert.alert(
      "Generar horarios grupales",
      "¿Está seguro de que desea generar automáticamente los horarios grupales basados en los horarios de docentes? Esto eliminará los horarios grupales existentes.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Generar",
          onPress: () => {
            // Eliminar horarios grupales existentes
            const gruposIds = grupos.map((g) => g.id)
            const horariosGrupales = horarios.filter(
              (h) => gruposIds.includes(h.salonId) && h.docenteId === "",
            )
            horariosGrupales.forEach((h) => deleteHorario(h.id))

            // Generar nuevos horarios grupales basados en horarios de docentes
            const horariosDocentes = horarios.filter((h) => h.docenteId !== "" && h.salonId !== "")
            horariosDocentes.forEach((horario) => {
              // Verificar si ya existe un horario para este grupo en este tiempo
              const existeHorario = horarios.find(
                (h) =>
                  h.salonId === horario.salonId &&
                  h.dia === horario.dia &&
                  h.horaInicio === horario.horaInicio &&
                  h.horaFin === horario.horaFin &&
                  h.docenteId === "",
              )

              if (!existeHorario) {
                addHorario({
                  dia: horario.dia,
                  horaInicio: horario.horaInicio,
                  horaFin: horario.horaFin,
                  materiaId: horario.materiaId,
                  docenteId: "",
                  salonId: horario.salonId,
                })
              }
            })

            Alert.alert("Éxito", "Horarios grupales generados correctamente")
          },
        },
      ],
    )
  }

  const renderEntityList = () => {
    const entities = currentTab === "docentes" ? docentes : grupos

    return (
      <ScrollView style={styles.entityList}>
        {entities.map((entity) => {
          const nombre =
            currentTab === "docentes"
              ? `${(entity as Docente).nombre} ${(entity as Docente).apellido}`
              : (entity as Grupo).nombre

          return (
            <View key={entity.id} style={styles.entityCard}>
              <TouchableOpacity
                style={[
                  styles.entityButton,
                  selectedEntity === entity.id && { backgroundColor: colors.primary + "40" },
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => setSelectedEntity(entity.id)}
              >
                <Text style={[styles.entityName, { color: colors.text }]}>{nombre}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pdfButton, { backgroundColor: colors.primary }]}
                onPress={() => convertirAPdf(entity)}
              >
                <Text style={styles.pdfButtonText}>PDF</Text>
              </TouchableOpacity>
            </View>
          )
        })}
      </ScrollView>
    )
  }

  const renderScheduleTable = () => {
    if (!selectedEntity) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            Seleccione un {currentTab === "docentes" ? "docente" : "grupo"} para ver su horario
          </Text>
        </View>
      )
    }

    return (
      <ScrollView style={styles.tableContainer}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={[styles.tableHeaderCell, styles.timeCell, { backgroundColor: colors.card }]}>
              <Text style={[styles.tableHeaderText, { color: colors.text }]}>Hora</Text>
            </View>
            {diasSemana.map((dia) => (
              <View key={dia} style={[styles.tableHeaderCell, { backgroundColor: colors.card }]}>
                <Text style={[styles.tableHeaderText, { color: colors.text }]}>{dia}</Text>
              </View>
            ))}
          </View>

          {bloquesHorarios.map((bloque) => (
            <View key={`${bloque.horaInicio}-${bloque.horaFin}`} style={styles.tableRow}>
              <View style={[styles.tableCell, styles.timeCell, { backgroundColor: colors.card }]}>
                <Text style={[styles.timeCellText, { color: colors.text }]}>
                  {bloque.horaInicio} - {bloque.horaFin}
                </Text>
              </View>

              {diasSemana.map((dia) => {
                if (bloque.esReceso) {
                  return (
                    <View
                      key={dia}
                      style={[styles.tableCell, styles.recesoCell, { backgroundColor: colors.card + "80" }]}
                    >
                      <Text style={[styles.recesoCellText, { color: colors.text }]}>RECESO</Text>
                    </View>
                  )
                }

                const horario = horarios.find(
                  (h) =>
                    h.dia === dia &&
                    h.horaInicio === bloque.horaInicio &&
                    h.horaFin === bloque.horaFin &&
                    (currentTab === "docentes" ? h.docenteId === selectedEntity : h.salonId === selectedEntity),
                )

                let content = null

                if (horario) {
                  if (currentTab === "docentes") {
                    const grupo = grupos.find((g) => g.id === horario.salonId)
                    content = (
                      <Text style={[styles.cellText, { color: colors.text }]}>
                        {grupo ? grupo.nombre : "Grupo no encontrado"}
                      </Text>
                    )
                  } else {
                    const materia = materias.find((m) => m.id === horario.materiaId)
                    content = (
                      <Text style={[styles.cellText, { color: colors.text }]}>
                        {materia ? materia.siglas : "Materia no encontrada"}
                      </Text>
                    )
                  }
                }

                return (
                  <TouchableOpacity
                    key={dia}
                    style={[
                      styles.tableCell,
                      horario ? { backgroundColor: colors.primary + "30" } : { backgroundColor: colors.background },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => handleCellPress(dia, bloque)}
                    onLongPress={() => handleDeleteHorario(dia, bloque)}
                  >
                    {content}
                  </TouchableOpacity>
                )
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    )
  }

  const renderLegend = () => {
    if (!selectedEntity) return null

    const filteredHorarios = horarios.filter((h) =>
      currentTab === "docentes" ? h.docenteId === selectedEntity : h.salonId === selectedEntity,
    )

    // Agrupar horarios por materia
    const horariosPorMateria = {}
    filteredHorarios.forEach((horario) => {
      if (!horariosPorMateria[horario.materiaId]) {
        horariosPorMateria[horario.materiaId] = []
      }
      horariosPorMateria[horario.materiaId].push(horario)
    })

    if (Object.keys(horariosPorMateria).length === 0) return null

    return (
      <View style={styles.legendContainer}>
        <Text style={[styles.legendTitle, { color: colors.text }]}>Detalles de Clases:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.keys(horariosPorMateria).map((materiaId) => {
            const materia = materias.find((m) => m.id === materiaId)

            if (!materia) return null

            const horarios = horariosPorMateria[materiaId]

            let detailContent = null

            if (currentTab === "docentes") {
              // Mostrar grupos para este docente y materia
              const gruposIds = [...new Set(horarios.map((h) => h.salonId))]
              const gruposNombres = gruposIds
                .map((id) => {
                  const grupo = grupos.find((g) => g.id === id)
                  return grupo ? grupo.nombre : "Grupo no encontrado"
                })
                .join(", ")

              detailContent = (
                <Text style={[styles.legendDetailText, { color: colors.secondary }]}>Grupos: {gruposNombres}</Text>
              )
            } else {
              // Mostrar docente para este grupo y materia
              const docenteId = horarios[0]?.docenteId
              const docente = docentes.find((d) => d.id === docenteId)

              detailContent = (
                <Text style={[styles.legendDetailText, { color: colors.secondary }]}>
                  Docente: {docente ? `${docente.nombre} ${docente.apellido}` : "Docente no encontrado"}
                </Text>
              )
            }

            return (
              <View
                key={materiaId}
                style={[styles.legendCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.legendCardTitle, { color: colors.text }]}>
                  {materia.siglas ? `${materia.siglas} - ` : ""}
                  {materia.nombre}
                </Text>
                {detailContent}
              </View>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  const renderMateriaSelector = () => {
    if (!selectedEntity) return null

    return (
      <View style={styles.materiaSelectorContainer}>
        <Text style={[styles.materiaSelectorTitle, { color: colors.text }]}>Seleccionar materia:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.materiaSelectorScroll}>
          {materias.map((materia) => (
            <TouchableOpacity
              key={materia.id}
              style={[
                styles.materiaItem,
                selectedMateria === materia.id && { backgroundColor: colors.primary + "40" },
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setSelectedMateria(materia.id)}
            >
              <Text style={[styles.materiaItemText, { color: colors.text }]}>
                {materia.siglas ? `${materia.siglas} - ` : ""}
                {materia.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
  }

  const convertirAPdf = async (entidad: { id: string }) => {
    try {
      // Verificar datos disponibles
      if (!Array.isArray(grupos) || grupos.length === 0) {
        console.warn("No hay grupos disponibles:", grupos)
        Alert.alert("Error", "No hay datos de grupos disponibles para generar el PDF.")
        return
      }

      // Obtener información de directivos
      const director = directivos.find((d) => d.rol === "Director")
      const subdirector = directivos.find((d) => d.rol === "Subdirector Académico")

      const directorNombre = director ? director.nombre : "No asignado"
      const directorPuesto = director ? (director.generoFemenino ? "Directora" : "Director") : "Director"

      const subdirectorNombre = subdirector ? subdirector.nombre : "No asignado"
      const subdirectorPuesto = subdirector
        ? subdirector.generoFemenino
          ? "Subdirectora Académica"
          : "Subdirector Académico"
        : "Subdirector Académico"

      let titulo = ""
      const subtitulo = ""

      if (currentTab === "docentes") {
        const docente = docentes?.find((d) => String(d.id) === String(entidad.id))
        titulo = docente
          ? `Horario del Docente: ${docente.nombre} ${docente.apellido}`
          : `Horario del Docente: ID ${entidad.id} (No encontrado)`
      } else {
        const grupo = grupos?.find((g) => String(g.id) === String(entidad.id))
        titulo = grupo ? `Horario del Grupo: ${grupo.nombre}` : `Horario del Grupo: ID ${entidad.id} (No encontrado)`
      }

      const horariosEntidad = horarios
        .filter((h) =>
          currentTab === "docentes"
            ? String(h.docenteId) === String(entidad.id)
            : String(h.salonId) === String(entidad.id),
        )
        .sort((a, b) => {
          const diasOrden = {
            Lunes: 0,
            Martes: 1,
            Miércoles: 2,
            Jueves: 3,
            Viernes: 4,
          }
          if (a.dia !== b.dia) {
            return diasOrden[a.dia] - diasOrden[b.dia]
          }
          return convertirHoraAMinutos(a.horaInicio) - convertirHoraAMinutos(b.horaInicio)
        })

      const horariosPorMateria = {}
      horariosEntidad.forEach((horario) => {
        const materiaId = String(horario.materiaId)
        if (!horariosPorMateria[materiaId]) {
          horariosPorMateria[materiaId] = []
        }
        horariosPorMateria[materiaId].push(horario)
      })

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
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              table-layout: fixed;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 4px;
              text-align: center;
              font-size: 10px;
              height: 24px;
              overflow: hidden;
            }
            th {
              background-color: #f4f4f4;
              font-size: 10px;
            }
            th:first-child, td:first-child {
              width: 10%;
            }
            .header { 
              text-align: center; 
              margin-bottom: 10px; 
            }
            h1 { 
              font-size: 16px; 
              color: #333;
              margin: 0 0 5px 0;
            }
            .legend-container {
              margin-top: 10px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            .legend-title {
              font-size: 14px;
              color: #333;
              margin-bottom: 8px;
            }
            .legend-items {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
              gap: 8px;
            }
            .legend-item {
              font-size: 9px;
              padding: 5px;
              border: 1px solid #ddd;
              border-radius: 3px;
              display: flex;
              align-items: flex-start;
            }
            .legend-info {
              flex: 1;
            }
            .legend-info-title {
              font-weight: bold;
              margin-bottom: 2px;
            }
            .legend-info-subtitle {
              color: #666;
              margin-bottom: 1px;
            }
            .class-cell {
              padding: 2px;
              font-weight: bold;
              font-size: 10px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              background-color: transparent;
              border: none;
            }
            .receso-cell {
              background-color: #f4f4f4;
              font-style: italic;
              font-size: 9px;
            }
            .signature-section {
              margin-top: 80px;
              display: flex;
              justify-content: space-between;
            }
            .signature {
              text-align: center;
              width: 45%;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin: 10px 0;
            }
            .signature-name {
              font-size: 12px;
              font-weight: bold;
              margin-top: 3px;
            }
            .signature-position {
              font-size: 10px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="font-size: 14px; margin: 0; font-weight: bold;">COLEGIO DE BACHILLERES DEL ESTADO DE VERACRUZ</p>
            <p style="font-size: 12px; margin: 3px 0; font-weight: normal;">ORGANISMO PUBLICO DESCENTRALIZADO</p>
            <p style="font-size: 13px; margin: 3px 0; font-weight: normal;">PLANTEL 18 - COATZACOALCOS</p>
          </div>
          <div class="header">
            <h1>${titulo}</h1>
            ${subtitulo ? `<p>${subtitulo}</p>` : ""}
          </div>
          <table>
            <tr>
              <th>Hora</th>
              ${diasSemana.map((dia) => `<th>${dia}</th>`).join("")}
            </tr>
            ${bloquesHorarios
              .map(
                (bloque) => `
              <tr>
                <td>${bloque.horaInicio} - ${bloque.horaFin}</td>
                ${diasSemana
                  .map((dia) => {
                    if (bloque.esReceso) {
                      return '<td class="receso-cell">Receso</td>'
                    }

                    const horario = horariosEntidad.find(
                      (h) =>
                        h.dia === dia &&
                        convertirHoraAMinutos(h.horaInicio) <= convertirHoraAMinutos(bloque.horaInicio) &&
                        convertirHoraAMinutos(h.horaFin) >= convertirHoraAMinutos(bloque.horaFin),
                    )

                    if (!horario) return "<td></td>"

                    let texto = ""
                    if (currentTab === "docentes") {
                      const grupo =
                        Array.isArray(grupos) && grupos.length > 0
                          ? grupos.find((g) => String(g.id) === String(horario.salonId))
                          : null
                      texto = grupo?.nombre || "Grupo no disponible"
                    } else {
                      const materia =
                        Array.isArray(materias) && materias.length > 0
                          ? materias.find((m) => String(m.id) === String(horario.materiaId)) || {
                              siglas: "",
                              nombre: "Materia no encontrada",
                            }
                          : {
                              siglas: "",
                              nombre: "Materia no encontrada",
                            }
                      texto = materia.siglas || materia.nombre
                    }

                    return `
                    <td>
                      <div class="class-cell">
                        ${texto}
                      </div>
                    </td>
                  `
                  })
                  .join("")}
              </tr>
            `,
              )
              .join("")}
          </table>
  
          <div class="legend-container">
            <div class="legend-title">Detalles de Clases:</div>
            <div class="legend-items">
              ${Object.keys(horariosPorMateria)
                .map((materiaId) => {
                  const horarios = horariosPorMateria[materiaId]
                  const materia =
                    Array.isArray(materias) && materias.length > 0
                      ? materias.find((m) => String(m.id) === String(materiaId)) || {
                          nombre: "Sin materia",
                          siglas: "",
                        }
                      : { nombre: "Sin materia", siglas: "" }
                  const gruposNombres =
                    Array.isArray(grupos) && grupos.length > 0
                      ? [...new Set(horarios.map((h) => String(h.salonId)))]
                          .map((salonId) => {
                            const grupo = grupos.find((g) => String(g.id) === salonId)
                            return grupo?.nombre || "Grupo no disponible"
                          })
                          .join(", ")
                      : "Grupo no disponible"
                  const docente =
                    currentTab === "grupos" && Array.isArray(docentes) && docentes.length > 0
                      ? docentes.find((d) => String(d.id) === String(horarios[0]?.docenteId))
                      : null
                  const docenteNombre = docente ? `${docente.nombre} ${docente.apellido}` : "Docente no encontrado"

                  return `
                  <div class="legend-item">
                    <div class="legend-info">
                      ${materia.siglas ? `<div class="legend-info-title">${materia.siglas}</div>` : ""}
                      <div class="legend-info-title">${materia.nombre}</div>
                      ${
                        currentTab === "docentes"
                          ? `
                        <div class="legend-info-subtitle">Grupos: ${gruposNombres}</div>
                      `
                          : `
                        <div class="legend-info-subtitle">Docente: ${docenteNombre}</div>
                      `
                      }
                    </div>
                  </div>
                `
                })
                .join("")}
            </div>
          </div>
  
          <div class="signature-section">
            <div class="signature">
              <div class="signature-line"></div>
              <p class="signature-name">${directorNombre}</p>
              <p class="signature-position">${directorPuesto}</p>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <p class="signature-name">${subdirectorNombre}</p>
              <p class="signature-position">${subdirectorPuesto}</p>
            </div>
          </div>
        </body>
        </html>
      `

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 612,
        height: 792,
      })

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartir horario",
        UTI: "com.adobe.pdf",
      })
    } catch (error) {
      console.error("Error al generar PDF:", error)
      Alert.alert("Error", "No se pudo generar el PDF. Intenta de nuevo.")
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, currentTab === "docentes" && [styles.activeTab, { borderColor: colors.primary }]]}
          onPress={() => {
            setCurrentTab("docentes")
            setSelectedEntity(null)
            setFullScreenMode(false)
          }}
        >
          <Text style={[styles.tabText, { color: currentTab === "docentes" ? colors.primary : colors.text }]}>
            Docentes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === "grupos" && [styles.activeTab, { borderColor: colors.primary }]]}
          onPress={() => {
            setCurrentTab("grupos")
            setSelectedEntity(null)
            setFullScreenMode(false)
          }}
        >
          <Text style={[styles.tabText, { color: currentTab === "grupos" ? colors.primary : colors.text }]}>
            Grupos
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {!fullScreenMode && (
          <View style={styles.sidebarContainer}>
            <Text style={[styles.sidebarTitle, { color: colors.text }]}>
              {currentTab === "docentes" ? "Docentes" : "Grupos"}
            </Text>
            {renderEntityList()}
          </View>
        )}

        <View style={[styles.scheduleContainer, fullScreenMode && { width: "100%" }]}>
          <View style={styles.scheduleHeader}>
            <View style={styles.scheduleHeaderLeft}>
              {fullScreenMode && (
                <TouchableOpacity
                  style={[styles.backButton, { backgroundColor: colors.primary }]}
                  onPress={() => setFullScreenMode(false)}
                >
                  <Feather name="arrow-left" size={20} color="#ffffff" />
                </TouchableOpacity>
              )}
              <Text style={[styles.scheduleTitle, { color: colors.text }]}>Horario</Text>
            </View>

            <View style={styles.scheduleHeaderRight}>
              {currentTab === "grupos" && (
                <TouchableOpacity
                  style={[styles.generateButton, { backgroundColor: colors.primary }]}
                  onPress={generateGroupSchedules}
                >
                  <Text style={styles.generateButtonText}>Generar Horarios</Text>
                </TouchableOpacity>
              )}

              {selectedEntity && (
                <TouchableOpacity
                  style={[styles.fullscreenButton, { backgroundColor: colors.primary }]}
                  onPress={() => setFullScreenMode(!fullScreenMode)}
                >
                  <Feather name={fullScreenMode ? "minimize" : "maximize"} size={20} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {renderMateriaSelector()}
          {renderScheduleTable()}
          {renderLegend()}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
  },
  sidebarContainer: {
    width: "30%",
    borderRightWidth: 1,
    borderRightColor: "#dee2e6",
    padding: 10,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  entityList: {
    flex: 1,
  },
  entityCard: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  entityButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    marginRight: 5,
  },
  entityName: {
    fontSize: 14,
  },
  pdfButton: {
    padding: 5,
    borderRadius: 5,
    width: 40,
    alignItems: "center",
  },
  pdfButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  scheduleContainer: {
    flex: 1,
    padding: 10,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  scheduleHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  fullscreenButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  generateButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginRight: 10,
  },
  generateButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: "center",
  },
  tableContainer: {
    flex: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 5,
  },
  tableHeader: {
    flexDirection: "row",
  },
  tableHeaderCell: {
    flex: 1,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  tableHeaderText: {
    fontWeight: "bold",
    fontSize: 12,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    flex: 1,
    height: 40,
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  timeCell: {
    width: 80,
  },
  timeCellText: {
    fontSize: 10,
  },
  cellText: {
    fontSize: 12,
    textAlign: "center",
  },
  recesoCell: {
    backgroundColor: "#f8f9fa",
  },
  recesoCellText: {
    fontSize: 10,
    fontStyle: "italic",
  },
  legendContainer: {
    marginTop: 10,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  legendCard: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    marginRight: 10,
    minWidth: 150,
  },
  legendCardTitle: {
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 5,
  },
  legendDetailText: {
    fontSize: 12,
  },
  materiaSelectorContainer: {
    marginBottom: 15,
  },
  materiaSelectorTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  materiaSelectorScroll: {
    flexDirection: "row",
  },
  materiaItem: {
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    borderWidth: 1,
  },
  materiaItemText: {
    fontSize: 12,
  },
})

export default ScheduleScreen
