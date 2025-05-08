"use client"

import { useState, useCallback, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from "react-native"
import { Calendar, type DateData } from "react-native-calendars"
import { useTheme } from "../context/ThemeContext"
import { useData, type Actividad } from "../context/DataContext"
import { Feather } from "@expo/vector-icons"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const ActivitiesScreen = () => {
  const { colors, theme } = useTheme()
  const { actividades, addActividad, updateActividad, deleteActividad } = useData()
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [modalVisible, setModalVisible] = useState(false)
  const [currentActivity, setCurrentActivity] = useState<Partial<Actividad> | null>(null)
  const [markedDates, setMarkedDates] = useState({})

  // Actualizar las fechas marcadas cuando cambien las actividades
  useEffect(() => {
    const marked = {}
    actividades.forEach((actividad) => {
      marked[actividad.fecha] = {
        marked: true,
        dotColor: actividad.color || "#6c757d",
      }
    })
    setMarkedDates(marked)
  }, [actividades])

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString)
  }, [])

  const filteredActivities = actividades.filter((actividad) => actividad.fecha === selectedDate)

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i < 10 ? `0${i}` : `${i}`
    return `${hour}:00`
  })

  const openAddModal = () => {
    setCurrentActivity({
      titulo: "",
      descripcion: "",
      fecha: selectedDate,
      horaInicio: "08:00",
      horaFin: "09:00",
      color: "#6c757d",
    })
    setModalVisible(true)
  }

  const openEditModal = (actividad: Actividad) => {
    setCurrentActivity(actividad)
    setModalVisible(true)
  }

  const handleSaveActivity = () => {
    if (
      !currentActivity ||
      !currentActivity.titulo ||
      !currentActivity.fecha ||
      !currentActivity.horaInicio ||
      !currentActivity.horaFin
    ) {
      return
    }

    if (currentActivity.id) {
      updateActividad(currentActivity.id, currentActivity)
    } else {
      addActividad(currentActivity as Omit<Actividad, "id">)
    }

    setModalVisible(false)
    setCurrentActivity(null)
  }

  const handleDeleteActivity = () => {
    if (currentActivity && currentActivity.id) {
      deleteActividad(currentActivity.id)
      setModalVisible(false)
      setCurrentActivity(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            selected: true,
            selectedColor: colors.primary,
            marked: markedDates[selectedDate]?.marked || false,
            dotColor: markedDates[selectedDate]?.dotColor || colors.primary,
          },
        }}
        theme={{
          calendarBackground: colors.card,
          textSectionTitleColor: colors.text,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: "#ffffff",
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          textDisabledColor: colors.secondary,
          dotColor: colors.primary,
          monthTextColor: colors.text,
          arrowColor: colors.primary,
          indicatorColor: colors.primary,
          // Dark mode specific settings
          backgroundColor: colors.background,
          textSectionTitleDisabledColor: colors.secondary + "80",
          textDisabledColor: colors.secondary + "80",
          textDayFontFamily: 'System',
          textMonthFontFamily: 'System',
          textDayHeaderFontFamily: 'System',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 16
        }}
      />

      <View style={styles.dayHeader}>
        <Text style={[styles.dayTitle, { color: colors.text }]}>{formatDate(selectedDate)}</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={openAddModal}>
          <Feather name="plus" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.timelineContainer}>
        {timeSlots.map((time) => {
          const activitiesAtTime = filteredActivities.filter((act) => act.horaInicio <= time && act.horaFin > time)

          return (
            <View key={time} style={styles.timeSlot}>
              <Text style={[styles.timeText, { color: colors.text }]}>{time}</Text>
              <View style={styles.activitiesContainer}>
                {activitiesAtTime.map((activity) => (
                  <TouchableOpacity
                    key={activity.id}
                    style={[
                      styles.activityCard,
                      {
                        backgroundColor: activity.color || colors.primary,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => openEditModal(activity)}
                  >
                    <Text style={styles.activityTitle}>{activity.titulo}</Text>
                    <Text style={styles.activityTime}>
                      {activity.horaInicio} - {activity.horaFin}
                    </Text>
                    {activity.descripcion ? (
                      <Text style={styles.activityDescription} numberOfLines={2}>
                        {activity.descripcion}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )
        })}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {currentActivity?.id ? "Editar Actividad" : "Nueva Actividad"}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Título"
              placeholderTextColor={colors.secondary}
              value={currentActivity?.titulo || ""}
              onChangeText={(text) => setCurrentActivity({ ...currentActivity, titulo: text })}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Descripción"
              placeholderTextColor={colors.secondary}
              multiline
              numberOfLines={3}
              value={currentActivity?.descripcion || ""}
              onChangeText={(text) => setCurrentActivity({ ...currentActivity, descripcion: text })}
            />

            <View style={styles.timeInputContainer}>
              <View style={styles.timeInput}>
                <Text style={[styles.timeLabel, { color: colors.text }]}>Hora inicio:</Text>
                <TextInput
                  style={[styles.timeInputField, { backgroundColor: colors.background, color: colors.text }]}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.secondary}
                  value={currentActivity?.horaInicio || ""}
                  onChangeText={(text) => setCurrentActivity({ ...currentActivity, horaInicio: text })}
                />
              </View>

              <View style={styles.timeInput}>
                <Text style={[styles.timeLabel, { color: colors.text }]}>Hora fin:</Text>
                <TextInput
                  style={[styles.timeInputField, { backgroundColor: colors.background, color: colors.text }]}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.secondary}
                  value={currentActivity?.horaFin || ""}
                  onChangeText={(text) => setCurrentActivity({ ...currentActivity, horaFin: text })}
                />
              </View>
            </View>

            <View style={styles.colorSelector}>
              <Text style={[styles.colorLabel, { color: colors.text }]}>Color:</Text>
              <View style={styles.colorOptions}>
                {["#6c757d", "#dc3545", "#fd7e14", "#ffc107", "#28a745", "#17a2b8", "#007bff", "#6f42c1"].map(
                  (color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        currentActivity?.color === color && styles.selectedColor,
                      ]}
                      onPress={() => setCurrentActivity({ ...currentActivity, color })}
                    />
                  ),
                )}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.secondary }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              {currentActivity?.id && (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#dc3545" }]}
                  onPress={handleDeleteActivity}
                >
                  <Text style={styles.modalButtonText}>Eliminar</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveActivity}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineContainer: {
    flex: 1,
  },
  timeSlot: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
    minHeight: 60,
  },
  timeText: {
    width: 60,
    padding: 10,
    textAlign: "center",
    fontWeight: "500",
  },
  activitiesContainer: {
    flex: 1,
    padding: 5,
  },
  activityCard: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
    borderWidth: 1,
  },
  activityTitle: {
    fontWeight: "bold",
    color: "#ffffff",
  },
  activityTime: {
    fontSize: 12,
    color: "#ffffff",
    marginTop: 2,
  },
  activityDescription: {
    fontSize: 12,
    color: "#ffffff",
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  timeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  timeInput: {
    width: "48%",
  },
  timeLabel: {
    marginBottom: 5,
  },
  timeInputField: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 5,
    padding: 10,
  },
  colorSelector: {
    marginBottom: 15,
  },
  colorLabel: {
    marginBottom: 5,
  },
  colorOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 5,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
})

export default ActivitiesScreen
