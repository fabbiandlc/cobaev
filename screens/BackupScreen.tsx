import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// Nombre de la tarea en segundo plano
const BACKGROUND_BACKUP_TASK = 'background-backup-task';

// Definir la tarea en segundo plano
TaskManager.defineTask(BACKGROUND_BACKUP_TASK, async () => {
  try {
    const now = new Date();
    console.log(`[${now.toISOString()}] Ejecutando backup automático...`);
    
    // Obtener las tareas de AsyncStorage
    const tasksJson = await AsyncStorage.getItem('tasks');
    if (!tasksJson) {
      console.log('No hay tareas para respaldar');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    // Crear directorio de respaldos si no existe
    const backupDir = `${FileSystem.documentDirectory}backups/`;
    const dirInfo = await FileSystem.getInfoAsync(backupDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
    }
    
    // Nombre del archivo con fecha y hora
    const timestamp = format(now, 'yyyy-MM-dd-HH-mm-ss');
    const fileName = `respaldo-actividades-${timestamp}.json`;
    const fileUri = `${backupDir}${fileName}`;
    
    // Guardar el archivo
    await FileSystem.writeAsStringAsync(fileUri, tasksJson, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    console.log(`Backup guardado: ${fileUri}`);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Error en backup automático:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

const BackupScreen = () => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [availableBackups, setAvailableBackups] = useState<string[]>([]);

  // Cargar información de respaldos al montar el componente
  useEffect(() => {
    loadBackupInfo();
    registerBackgroundTask();
    
    // Configurar intervalo para verificar respaldos cada minuto
    const interval = setInterval(loadBackupInfo, 60000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Registrar tarea en segundo plano
  const registerBackgroundTask = async () => {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_BACKUP_TASK, {
        minimumInterval: 60 * 60, // 1 hora en segundos
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Tarea de respaldo automático registrada');
    } catch (error) {
      console.error('Error al registrar tarea:', error);
    }
  };

  // Cargar información de respaldos
  const loadBackupInfo = async () => {
    try {
      const backupDir = `${FileSystem.documentDirectory}backups/`;
      const dirInfo = await FileSystem.getInfoAsync(backupDir);
      
      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(backupDir);
        const backupFiles = files
          .filter(file => file.startsWith('respaldo-actividades-') && file.endsWith('.json'))
          .sort()
          .reverse();
        
        setAvailableBackups(backupFiles);
        
        if (backupFiles.length > 0) {
          const lastBackupFile = backupFiles[0];
          const fileInfo = await FileSystem.getInfoAsync(`${backupDir}${lastBackupFile}`);
          if (fileInfo.exists) {
            const lastModified = new Date(fileInfo.modificationTime || 0);
            setLastBackup(lastModified.toISOString());
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar información de respaldos:', error);
    }
  };

  // Crear respaldo manual
  const createBackup = async () => {
    try {
      setIsLoading(true);
      setBackupStatus('Creando copia de seguridad...');
      
      // Obtener tareas actuales
      const tasksJson = await AsyncStorage.getItem('tasks');
      if (!tasksJson) {
        setBackupStatus('No hay actividades para respaldar');
        return;
      }
      
      const tasks = JSON.parse(tasksJson);
      if (tasks.length === 0) {
        setBackupStatus('No hay actividades para respaldar');
        return;
      }
      
      // Crear directorio de respaldos si no existe
      const backupDir = `${FileSystem.documentDirectory}backups/`;
      const dirInfo = await FileSystem.getInfoAsync(backupDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
      }
      
      // Nombre del archivo con fecha y hora
      const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
      const fileName = `respaldo-actividades-${timestamp}.json`;
      const fileUri = `${backupDir}${fileName}`;
      
      // Guardar el archivo
      await FileSystem.writeAsStringAsync(fileUri, tasksJson, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Actualizar lista de respaldos
      await loadBackupInfo();
      
      // Compartir el archivo
      await Sharing.shareAsync(fileUri, {
        dialogTitle: 'Compartir copia de seguridad',
        UTI: 'public.json',
        mimeType: 'application/json',
      });
      
      setBackupStatus(`Respaldo creado: ${tasks.length} actividades guardadas`);
    } catch (error) {
      console.error('Error al crear respaldo:', error);
      Alert.alert('Error', 'No se pudo crear la copia de seguridad');
      setBackupStatus('Error al crear el respaldo');
    } finally {
      setIsLoading(false);
    }
  };

  // Restaurar desde respaldo
  const restoreBackup = async () => {
    try {
      setIsLoading(true);
      setBackupStatus('Seleccionando archivo de respaldo...');
      
      // Abrir selector de archivos
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        setBackupStatus(`Restaurando desde: ${selectedFile.name}`);
        
        try {
          // Leer el archivo
          const fileContent = await FileSystem.readAsStringAsync(selectedFile.uri);
          const tasks = JSON.parse(fileContent);
          
          // Validar que sea un array de tareas
          if (!Array.isArray(tasks)) {
            throw new Error('Formato de archivo no válido');
          }
          
          // Validar estructura básica de las tareas
          const isValid = tasks.every(task => 
            task.id && task.name && task.date && task.status
          );
          
          if (!isValid) {
            throw new Error('El archivo no contiene datos de actividades válidos');
          }
          
          // Guardar las tareas
          await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
          
          // Notificar a ActivitiesScreen que se restauró un respaldo
          await AsyncStorage.setItem('lastRestoreTime', new Date().toISOString());
          
          Alert.alert('Éxito', `Se restauraron ${tasks.length} actividades correctamente`);
          setBackupStatus(`Restauración completada: ${tasks.length} actividades`);
        } catch (error) {
          console.error('Error al procesar el archivo:', error);
          Alert.alert('Error', 'El archivo seleccionado no es un respaldo válido');
          setBackupStatus('Error: Archivo no válido');
        }
      } else {
        setBackupStatus('Restauración cancelada');
      }
    } catch (error) {
      console.error('Error al restaurar respaldo:', error);
      Alert.alert('Error', 'No se pudo restaurar la copia de seguridad');
      setBackupStatus('Error al restaurar');
    } finally {
      setIsLoading(false);
    }
  };

  // Formatear fecha legible
  const formatBackupDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy 'a las' HH:mm", { locale: es });
    } catch (error) {
      return 'Fecha desconocida';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Copia de Seguridad</Text>
      
      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Respaldo Actual</Text>
        {lastBackup ? (
          <Text style={[styles.lastBackup, { color: colors.text }]}>
            Último respaldo: {formatBackupDate(lastBackup)}
          </Text>
        ) : (
          <Text style={[styles.noBackup, { color: colors.text }]}>No hay respaldos guardados</Text>
        )}
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={createBackup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Guardar copia de seguridad</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={restoreBackup}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Recuperar copia de seguridad</Text>
        </TouchableOpacity>
      </View>
      
      {backupStatus ? (
        <Text style={[styles.status, { color: colors.text }]}>{backupStatus}</Text>
      ) : null}
      
      {availableBackups.length > 0 && (
        <View style={styles.backupList}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Respaldos disponibles:</Text>
          <ScrollView style={styles.scrollView}>
            {availableBackups.map((backup, index) => (
              <View key={index} style={[styles.backupItem, { borderBottomColor: colors.border }]}>
                <Text style={{ color: colors.text }}>{backup}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  lastBackup: {
    fontSize: 16,
    color: '#4CAF50',
  },
  noBackup: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginVertical: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  status: {
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  backupList: {
    marginTop: 20,
    flex: 1,
  },
  scrollView: {
    maxHeight: 200,
    marginTop: 10,
  },
  backupItem: {
    padding: 10,
    borderBottomWidth: 1,
  },
});

export default BackupScreen;
