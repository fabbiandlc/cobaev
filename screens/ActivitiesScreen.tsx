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
import { Calendar, LocaleConfig } from "react-native-calendars"
import * as Notifications from 'expo-notifications';
import { useTheme } from "../context/ThemeContext"
import { Feather } from "@expo/vector-icons"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Configurar el manejador de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type TaskStatus = "pending" | "in_progress" | "completed"
type UrgencyLevel = 'baja' | 'media' | 'alta'

interface Task {
  id: string
  name: string
  description: string
  date: string
  status: TaskStatus
  urgency: UrgencyLevel
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

const urgencyColors = {
  baja: '#4CAF50',  // Verde
  media: '#FFC107', // Amarillo
  alta: '#F44336'   // Rojo
}

// Configurar la localización en español
LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  monthNamesShort: [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ],
  dayNames: [
    'Domingo', 'Lunes', 'Martes', 'Miércoles',
    'Jueves', 'Viernes', 'Sábado'
  ],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};

// Establecer el idioma por defecto
LocaleConfig.defaultLocale = 'es';

export default function ActivitiesScreen() {
  const { colors, theme } = useTheme()
  const [tasks, setTasks] = useState<Task[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [markedDates, setMarkedDates] = useState({})
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const appState = useRef(AppState.currentState);
  const restoreCheckInterval = useRef<NodeJS.Timeout>();

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [urgency, setUrgency] = useState<UrgencyLevel>('media')

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

    // Cargar tareas guardadas
    loadTasks();

    // Monitorear cambios en el estado de la aplicación
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        // La app volvió a primer plano, recargamos las tareas
        loadTasks();
      }
      
      appState.current = nextAppState;
    });

    // Listener for backup restoration
    const checkForRestoration = async () => {
      try {
        const lastRestoreTime = await AsyncStorage.getItem('lastRestoreTime');
        const lastCheckedTime = await AsyncStorage.getItem('lastCheckedRestoreTime');
        
        if (lastRestoreTime && lastRestoreTime !== lastCheckedTime) {
          // Reload tasks if a restoration was detected
          loadTasks();
          await AsyncStorage.setItem('lastCheckedRestoreTime', lastRestoreTime);
        }
      } catch (error) {
        console.error('Error checking for restoration:', error);
      }
    };

    // Check for restorations every 5 seconds
    restoreCheckInterval.current = setInterval(checkForRestoration, 5000);

    // Limpiar listeners al desmontar
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      subscription.remove();
      clearInterval(restoreCheckInterval.current);
    };
  }, []);

  // Función para cargar tareas desde AsyncStorage
  const loadTasks = async () => {
    try {
      const tasksJson = await AsyncStorage.getItem('tasks');
      if (tasksJson) {
        const savedTasks = JSON.parse(tasksJson);
        setTasks(savedTasks);
        updateMarkedDates(savedTasks);
      }
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      Alert.alert('Error', 'No se pudieron cargar las tareas guardadas');
    }
  };

  // Función para guardar tareas en AsyncStorage
  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('Error al guardar tareas:', error);
      Alert.alert('Error', 'No se pudieron guardar los cambios');
    }
  };

  // Actualizar las fechas marcadas en el calendario
  const updateMarkedDates = (taskList: Task[]) => {
    const newMarkedDates = {};
    
    // Marcar el día actual
    const today = format(new Date(), "yyyy-MM-dd");
    newMarkedDates[today] = {
      selected: today === selectedDate,
      marked: false,
      customStyles: {
        container: {
          backgroundColor: today === selectedDate ? colors.primary : '#2196f3',
        },
        text: {
          color: 'white',
        }
      }
    };
    
    // Marcar días con tareas
    taskList.forEach(task => {
      if (task.date === today) return; // Ya está marcado como día actual
      
      newMarkedDates[task.date] = {
        ...newMarkedDates[task.date],
        selected: task.date === selectedDate,
        marked: true,
        customStyles: {
          container: {
            backgroundColor: task.date === selectedDate ? colors.primary : undefined,
          },
          text: {
            color: task.date === selectedDate ? 'white' : undefined,
          },
          dot: {
            color: getTaskDotColor(task),
          }
        }
      };
    });
    
    setMarkedDates(newMarkedDates);
  };

  // Obtener el color del punto para la tarea en el calendario
  const getTaskDotColor = (task: Task) => {
    if (task.status === 'completed') return statusColors.completed;
    return urgencyColors[task.urgency];
  };

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
    updateMarkedDates(tasks);
  }, [tasks, selectedDate, colors.primary])

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString)
  }, [])

  const filteredTasks = tasks.filter((task) => task.date === selectedDate)

  // Helpers
  const resetForm = () => {
    setName("")
    setDescription("")
    setUrgency('media')
    setEditingTask(null)
  }

  const openForm = (task: Task | null = null) => {
    if (task) {
      setName(task.name)
      setDescription(task.description)
      setUrgency(task.urgency)
      setEditingTask(task)
    } else {
      resetForm()
    }
    setModalVisible(true)
  }

  const closeForm = () => {
    setModalVisible(false)
    resetForm()
  }

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre de la tarea es obligatorio")
      return
    }

    let updatedTasks: Task[]

    if (editingTask) {
      // Actualizar tarea existente
      updatedTasks = tasks.map((t) =>
        t.id === editingTask.id
          ? { ...t, name, description, urgency }
          : t
      )
    } else {
      // Crear nueva tarea
      const newTask: Task = {
        id: Date.now().toString(),
        name,
        description,
        date: selectedDate,
        status: "pending",
        urgency,
      }
      updatedTasks = [...tasks, newTask]
      
      // Programar notificación para la nueva tarea
      schedulePushNotification(newTask);
    }

    setTasks(updatedTasks)
    saveTasks(updatedTasks)
    updateMarkedDates(updatedTasks)
    closeForm()
  }

  const handleDelete = (id: string) => {
    Alert.alert("Confirmar", "¿Estás seguro de eliminar esta tarea?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          const updatedTasks = tasks.filter((t) => t.id !== id)
          setTasks(updatedTasks)
          saveTasks(updatedTasks)
          updateMarkedDates(updatedTasks)
        },
      },
    ])
  }

  const handleStatusChange = (task: Task) => {
    const statusOrder: TaskStatus[] = ["pending", "in_progress", "completed"]
    const currentIndex = statusOrder.indexOf(task.status)
    const nextIndex = (currentIndex + 1) % statusOrder.length
    const newStatus = statusOrder[nextIndex]

    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, status: newStatus } : t
    )
    setTasks(updatedTasks)
    saveTasks(updatedTasks)
    updateMarkedDates(updatedTasks)
  }

  const renderTask = ({ item }: { item: Task }) => (
    <View style={[styles.card, { 
      backgroundColor: colors.card,
      borderLeftWidth: 6,
      borderLeftColor: urgencyColors[item.urgency]
    }]}>
      <TouchableOpacity onPress={() => openForm(item)} style={{ flex: 1 }}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
          <View style={[
            styles.urgencyBadge,
            { backgroundColor: urgencyColors[item.urgency] + '33' } // Agregar transparencia
          ]}>
            <Text style={styles.urgencyText}>
              {item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={[styles.cardDescription, { color: colors.text }]}>{item.description}</Text>
      </TouchableOpacity>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: statusColors[item.status] }]}
          onPress={(e) => {
            e.stopPropagation();
            handleStatusChange(item);
          }}
        >
          <Text style={styles.statusButtonText}>{statusLabels[item.status]}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.danger }]}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.statusButtonText}>
            <Feather name="trash-2" size={16} color="#fff" /> Eliminar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        current={selectedDate}
        firstDay={1}
        locale="es"
        theme={{
          calendarBackground: colors.background,
          textSectionTitleColor: colors.text,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: "#fff",
          todayTextColor: '#ffffff',
          dayTextColor: colors.text,
          textDisabledColor: "#d9e1e8",
          monthTextColor: colors.text,
          todayBackgroundColor: '#2196f3', // Forzar el fondo azul para el día actual
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 14,
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
              placeholderTextColor={theme === 'dark' ? '#e9ecef' : '#6c757d'}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { 
                color: colors.text, 
                borderColor: colors.border,
                minHeight: 100,
                textAlignVertical: 'top'
              }]}
              placeholder="Descripción"
              placeholderTextColor={theme === 'dark' ? '#e9ecef' : '#6c757d'}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Nivel de Urgencia</Text>
            <View style={styles.urgencyContainer}>
              {(['baja', 'media', 'alta'] as UrgencyLevel[]).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.urgencyButton,
                    {
                      backgroundColor: urgency === level ? 
                        level === 'baja' ? '#4CAF50' :
                        level === 'media' ? '#FFC107' : '#F44336' :
                        colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setUrgency(level)}
                >
                  <Text
                    style={[
                      styles.urgencyButtonText,
                      { 
                        color: urgency === level ? '#fff' : colors.text,
                        fontWeight: urgency === level ? 'bold' : 'normal'
                      },
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
  },
  urgencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  urgencyButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardTextContainer: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    minWidth: 100,
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
  },
  deleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginLeft: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'transparent',
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
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
})
