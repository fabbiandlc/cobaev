import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BackupScreen = () => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');

  // Function to create a backup
  const createBackup = async (type: 'local' | 'cloud') => {
    setIsLoading(true);
    setBackupStatus('Creando copia de seguridad...');
    
    try {
      // Get all data from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const data = await AsyncStorage.multiGet(keys);
      const backupData = Object.fromEntries(data);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup-${timestamp}.json`;
      const fileContent = JSON.stringify(backupData, null, 2);
      
      if (type === 'local') {
        // Save to local storage
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, fileContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        
        // Share the file
        await Sharing.shareAsync(fileUri, {
          dialogTitle: 'Compartir copia de seguridad',
          UTI: 'public.json',
          mimeType: 'application/json',
        });
        setBackupStatus('Copia de seguridad local creada y lista para compartir');
      } else {
        // Upload to Supabase Storage
        const { data: uploadData, error } = await supabase.storage
          .from('backups')
          .upload(`backups/${fileName}`, fileContent, {
            contentType: 'application/json',
            upsert: true,
          });
        
        if (error) throw error;
        setBackupStatus('Copia de seguridad guardada en la nube');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      Alert.alert('Error', 'No se pudo crear la copia de seguridad');
      setBackupStatus('Error al crear la copia de seguridad');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to restore from backup
  const restoreBackup = async (type: 'local' | 'cloud') => {
    if (type === 'local') {
      // Open document picker for local restore
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });

        if (result.type === 'success') {
          const fileContent = await FileSystem.readAsStringAsync(result.uri);
          const backupData = JSON.parse(fileContent);
          
          // Restore data to AsyncStorage
          const entries = Object.entries(backupData);
          await AsyncStorage.multiSet(entries);
          
          Alert.alert('Éxito', 'Datos restaurados correctamente');
          setBackupStatus('Datos restaurados desde archivo local');
        }
      } catch (error) {
        console.error('Error restoring backup:', error);
        Alert.alert('Error', 'No se pudo restaurar la copia de seguridad');
      }
    } else {
      // List and restore from cloud backups
      try {
        const { data: files, error } = await supabase.storage
          .from('backups')
          .list('backups');
        
        if (error) throw error;
        
        if (files.length === 0) {
          Alert.alert('Info', 'No hay copias de seguridad en la nube');
          return;
        }
        
        // Sort by most recent
        const sortedFiles = files.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        // Get the most recent backup
        const latestBackup = sortedFiles[0];
        const { data: fileContent, error: downloadError } = await supabase.storage
          .from('backups')
          .download(`backups/${latestBackup.name}`);
        
        if (downloadError) throw downloadError;
        
        // Read the file content
        const text = await fileContent.text();
        const backupData = JSON.parse(text);
        
        // Restore data to AsyncStorage
        const entries = Object.entries(backupData);
        await AsyncStorage.multiSet(entries);
        
        Alert.alert('Éxito', 'Datos restaurados desde la nube');
        setBackupStatus('Datos restaurados desde la nube');
      } catch (error) {
        console.error('Error restoring cloud backup:', error);
        Alert.alert('Error', 'No se pudo restaurar desde la nube');
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Copia de Seguridad</Text>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Crear Copia de Seguridad
        </Text>
        
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => createBackup('local')}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Guardar Localmente</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => createBackup('cloud')}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Guardar en la Nube</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Restaurar desde Copia
        </Text>
        
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => restoreBackup('local')}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Restaurar desde Archivo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => restoreBackup('cloud')}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Restaurar desde la Nube</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {backupStatus ? (
        <Text style={[styles.status, { color: colors.text }]}>{backupStatus}</Text>
      ) : null}
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  button: {
    width: '48%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  status: {
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default BackupScreen;
