import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const menuItems = [
    { title: 'Docentes', icon: 'people', screen: 'Docentes' },
    { title: 'Materias', icon: 'book', screen: 'Materias' },
    { title: 'Grupos', icon: 'school', screen: 'Grupos' },
    { title: 'Horarios', icon: 'time', screen: 'Horarios' },
    { title: 'Actividades', icon: 'calendar', screen: 'Actividades' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Bienvenido/a</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Gestión Escolar - COBAEV
        </Text>
      </View>

      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate(item.screen as never)}
          >
            <Ionicons 
              name={item.icon as any} 
              size={32} 
              color={colors.primary} 
              style={styles.icon}
            />
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  icon: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default HomeScreen;
