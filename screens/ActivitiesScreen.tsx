"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
  Platform,
  AppState,
} from "react-native"
import { Calendar, type DateData } from "react-native-calendars"
import * as DocumentPicker from "expo-document-picker"
import * as Notifications from 'expo-notifications';
import { useTheme } from "../context/ThemeContext"
import { Feather } from "@expo/vector-icons"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Configurar el manejador de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type TaskStatus = "pending" | "in_progress" | "completed"

interface Task {
  id: string
  name: string
  description: string
  date: string
  creatorAttachment?: { name: string; uri: string }
  collaboratorAttachment?: { name: string; uri: string }
  status: TaskStatus
}

const statusColors = {
  pending: "#e74c3c",
  in_progress: "#f1c40f",
  completed: "#2ecc71",
}

const statusLabels = {
  pending: "Pendiente",
  in_progress: "En Progreso",
  completed: "Completado",
}

export default function ActivitiesScreen() {
  const { colors, theme } = useTheme()
  const [tasks, setTasks] = useState<Task[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [markedDates, setMarkedDates] = useState({})
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [creatorAttachment, setCreatorAttachment] = useState<{ name: string; uri: string } | null>(null)
  const [collaboratorAttachment, setCollaboratorAttachment] = useState<{ name: string; uri: string } | null>(null)

  // Configurar notificaciones al montar el componente
  useEffect(() => {
    registerForPushNotificationsAsync();

    // Configurar el listener para cuando se recibe una notificación
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificación recibida:', notification);
    });

    // Configurar el listener para cuando el usuario interactúa con la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Respuesta a notificación:', response);
    });

    // Limpiar listeners al desmontar
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Función para registrar el dispositivo para notificaciones push
  async function registerForPushNotificationsAsync() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permiso denegado para notificaciones');
      return;
    }

    // Configurar el canal de notificación para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }
  }

  // Función para programar una notificación local
  async function schedulePushNotification(task: Task) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Nueva tarea creada",
        body: `Tarea: ${task.name}`,
        data: { taskId: task.id },
        sound: 'default',
      },
      trigger: { seconds: 1 }, // Mostrar notificación después de 1 segundo
    });
  }

  // Update marked dates when tasks change
  useEffect(() => {
    const marked: any = {}
    tasks.forEach((task) => {
      marked[task.date] = {
        marked: true,
        dotColor: statusColors[task.status],
      }
    })
    // Add current date marker
    const today = format(new Date(), "yyyy-MM-dd")
    if (!marked[today]) {
      marked[today] = { selected: true, selectedColor: colors.primary }
    } else {
      marked[today].selected = true
      marked[today].selectedColor = colors.primary
    }
    setMarkedDates(marked)
  }, [tasks, colors.primary])

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString)
  }, [])

  const filteredTasks = tasks.filter((task) => task.date === selectedDate)

  // Helpers
  const resetForm = () => {
    setName("")
    setDescription("")
    setCreatorAttachment(null)
    setCollaboratorAttachment(null)
    setEditingTask(null)
  }

  const openForm = (task?: Task) => {
    if (task) {
      setEditingTask(task)
      setName(task.name)
      setDescription(task.description)
      setCreatorAttachment(task.creatorAttachment || null)
      setCollaboratorAttachment(task.collaboratorAttachment || null)
    } else {
      setEditingTask(null)
      resetForm()
    }
    setModalVisible(true)
  }

  const closeForm = () => {
    resetForm()
    setModalVisible(false)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre de la tarea es obligatorio")
      return
    }
    
    if (editingTask) {
      setTasks(
        tasks.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                name,
                description,
                creatorAttachment: creatorAttachment || undefined,
                collaboratorAttachment: collaboratorAttachment || undefined,
              }
            : t
        )
      )
    } else {
      const newTask = {
        id: Date.now().toString(),
        name,
        description,
        date: selectedDate,
        creatorAttachment: creatorAttachment || undefined,
        collaboratorAttachment: collaboratorAttachment || undefined,
        status: "pending" as const,
      };
      
      setTasks([...tasks, newTask]);
      
      // Programar notificación para la nueva tarea
      await schedulePushNotification(newTask);
    }
    closeForm()
  }

  const handleDelete = (id: string) => {
    Alert.alert("Eliminar", "¿Eliminar esta tarea?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => setTasks(tasks.filter((t) => t.id !== id)),
      },
    ])
  }

  const handlePickFile = async (type: "creator" | "collaborator") => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })
    if (result.type === "success") {
      const file = { name: result.name, uri: result.uri }
      if (type === "creator") setCreatorAttachment(file)
      else setCollaboratorAttachment(file)
    }
  }

  const handleStatusChange = (task: Task) => {
    const nextStatus: TaskStatus =
      task.status === "pending"
        ? "in_progress"
        : task.status === "in_progress"
        ? "completed"
        : "pending"
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)))
  }

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => openForm(item)}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
          <Text style={{ color: colors.text }}>{item.description}</Text>
        </View>
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: statusColors[item.status] }]}
          onPress={(e) => {
            e.stopPropagation()
            handleStatusChange(item)
          }}
        >
          <Text style={styles.statusButtonText}>{statusLabels[item.status]}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...markedDates[selectedDate as keyof typeof markedDates],
            selected: true,
            selectedColor: colors.primary,
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
          backgroundColor: colors.background,
          textSectionTitleDisabledColor: `${colors.secondary}80`,
          textDisabledColor: `${colors.secondary}80`,
          textDayFontFamily: "System",
          textMonthFontFamily: "System",
          textDayHeaderFontFamily: "System",
          textDayFontWeight: "300",
          textMonthFontWeight: "bold",
          textDayHeaderFontWeight: "300",
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 16,
        }}
      />

      <View style={styles.dayHeader}>
        <Text style={[styles.dayTitle, { color: colors.text }]}>
          {format(new Date(selectedDate), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
        </Text>
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        ListEmptyComponent={
          <Text style={{ color: colors.text, textAlign: "center", marginTop: 40 }}>Sin tareas para este día</Text>
        }
      />

      {/* Floating + button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => openForm()}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal Form */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingTask ? "Editar Tarea" : "Nueva Tarea"}
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Nombre de la tarea"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Descripción"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Anexo de Creador</Text>
            <TouchableOpacity
              style={[styles.attachmentButton, { backgroundColor: colors.background }]}
              onPress={() => handlePickFile("creator")}
            >
              <Text style={[styles.attachmentButtonText, { color: colors.text }]}>
                {creatorAttachment ? creatorAttachment.name : "Subir archivo"}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Anexo de Colaborador</Text>
            <TouchableOpacity
              style={[styles.attachmentButton, { backgroundColor: colors.background }]}
              onPress={() => handlePickFile("collaborator")}
            >
              <Text style={[styles.attachmentButtonText, { color: colors.text }]}>
                {collaboratorAttachment ? collaboratorAttachment.name : "Subir archivo"}
              </Text>
            </TouchableOpacity>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.secondary }]}
                onPress={closeForm}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
            {editingTask && (
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: "#e74c3c" }]}
                onPress={() => {
                  closeForm()
                  handleDelete(editingTask.id)
                }}
              >
                <Text style={styles.buttonText}>Eliminar Tarea</Text>
              </TouchableOpacity>
            )}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
  },
  card: {
    margin: 12,
    padding: 18,
    borderRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statusButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "bold",
  },
  attachmentButton: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    alignItems: "center",
  },
  attachmentButtonText: {
    color: "#495057",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
})
