"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from "react-native"
import { useTheme } from "../context/ThemeContext"
import { useData } from "../context/DataContext"
import { Feather } from "@expo/vector-icons"

const ManagementScreen = () => {
  const { colors } = useTheme()
  const {
    docentes,
    materias,
    grupos,
    directivos,
    addDocente,
    addMateria,
    addGrupo,
    addDirectivo,
    updateDocente,
    updateMateria,
    updateGrupo,
    updateDirectivo,
    deleteDocente,
    deleteMateria,
    deleteGrupo,
    deleteDirectivo,
  } = useData()

  const [activeTab, setActiveTab] = useState("docentes")
  const [modalVisible, setModalVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentEditId, setCurrentEditId] = useState<string | null>(null)

  // Estados para formularios
  const [docenteForm, setDocenteForm] = useState({ nombre: "", apellido: "", email: "", numeroEmpleado: "" })
  const [materiaForm, setMateriaForm] = useState({ nombre: "", siglas: "" })
  const [grupoForm, setGrupoForm] = useState({ nombre: "", docenteId: "" })
  const [directivoForm, setDirectivoForm] = useState({ nombre: "", rol: "Director", generoFemenino: false })

  const resetForms = () => {
    setDocenteForm({ nombre: "", apellido: "", email: "", numeroEmpleado: "" })
    setMateriaForm({ nombre: "", siglas: "" })
    setGrupoForm({ nombre: "", docenteId: "" })
    setDirectivoForm({ nombre: "", rol: "Director", generoFemenino: false })
    setCurrentEditId(null)
    setIsEditing(false)
  }

  const handleAddItem = () => {
    if (activeTab === "docentes") {
      if (!docenteForm.nombre || !docenteForm.apellido || !docenteForm.email || !docenteForm.numeroEmpleado) {
        Alert.alert("Error", "Por favor complete todos los campos")
        return
      }
      
      if (isEditing && currentEditId) {
        updateDocente(currentEditId, docenteForm)
      } else {
        addDocente(docenteForm)
      }
    } else if (activeTab === "materias") {
      if (!materiaForm.nombre || !materiaForm.siglas) {
        Alert.alert("Error", "Por favor complete todos los campos")
        return
      }
      
      if (isEditing && currentEditId) {
        updateMateria(currentEditId, materiaForm)
      } else {
        addMateria(materiaForm)
      }
    } else if (activeTab === "grupos") {
      if (!grupoForm.nombre || !grupoForm.docenteId) {
        Alert.alert("Error", "Por favor complete todos los campos")
        return
      }
      
      if (isEditing && currentEditId) {
        updateGrupo(currentEditId, grupoForm)
      } else {
        addGrupo(grupoForm)
      }
    } else if (activeTab === "directivos") {
      if (!directivoForm.nombre || !directivoForm.rol) {
        Alert.alert("Error", "Por favor complete todos los campos")
        return
      }
      
      if (isEditing && currentEditId) {
        updateDirectivo(currentEditId, directivoForm)
      } else {
        addDirectivo(directivoForm)
      }
    }

    resetForms()
    setModalVisible(false)
  }

  const handleEditItem = (id: string) => {
    setIsEditing(true)
    setCurrentEditId(id)
    
    if (activeTab === "docentes") {
      const docente = docentes.find(d => d.id === id)
      if (docente) {
        setDocenteForm({
          nombre: docente.nombre,
          apellido: docente.apellido,
          email: docente.email,
          numeroEmpleado: docente.numeroEmpleado
        })
      }
    } else if (activeTab === "materias") {
      const materia = materias.find(m => m.id === id)
      if (materia) {
        setMateriaForm({
          nombre: materia.nombre,
          siglas: materia.siglas
        })
      }
    } else if (activeTab === "grupos") {
      const grupo = grupos.find(g => g.id === id)
      if (grupo) {
        setGrupoForm({
          nombre: grupo.nombre,
          docenteId: grupo.docenteId
        })
      }
    } else if (activeTab === "directivos") {
      const directivo = directivos.find(d => d.id === id)
      if (directivo) {
        setDirectivoForm({
          nombre: directivo.nombre,
          rol: directivo.rol,
          generoFemenino: directivo.generoFemenino
        })
      }
    }
    
    setModalVisible(true)
  }

  const handleDeleteItem = (id: string) => {
    Alert.alert("Confirmar eliminación", "¿Está seguro de que desea eliminar este elemento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          if (activeTab === "docentes") {
            deleteDocente(id)
          } else if (activeTab === "materias") {
            deleteMateria(id)
          } else if (activeTab === "grupos") {
            deleteGrupo(id)
          } else if (activeTab === "directivos") {
            deleteDirectivo(id)
          }
        },
      },
    ])
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "docentes":
        return (
          <ScrollView style={styles.tabContent}>
            {docentes.map((docente) => (
              <View
                key={docente.id}
                style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>
                    {docente.nombre} {docente.apellido}
                  </Text>
                  <Text style={[styles.itemSubtitle, { color: colors.secondary }]}>Email: {docente.email}</Text>
                  <Text style={[styles.itemSubtitle, { color: colors.secondary }]}>
                    No. Empleado: {docente.numeroEmpleado}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity 
                    style={[styles.editButton, { backgroundColor: colors.primary }]} 
                    onPress={() => handleEditItem(docente.id)}
                  >
                    <Feather name="edit-2" size={16} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.deleteButton, { backgroundColor: "#dc3545" }]} 
                    onPress={() => handleDeleteItem(docente.id)}
                  >
                    <Feather name="trash-2" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )
      case "materias":
        return (
          <ScrollView style={styles.tabContent}>
            {materias.map((materia) => (
              <View
                key={materia.id}
                style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>{materia.nombre}</Text>
                  <Text style={[styles.itemSubtitle, { color: colors.secondary }]}>Siglas: {materia.siglas}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity 
                    style={[styles.editButton, { backgroundColor: colors.primary }]} 
                    onPress={() => handleEditItem(materia.id)}
                  >
                    <Feather name="edit-2" size={16} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.deleteButton, { backgroundColor: "#dc3545" }]} 
                    onPress={() => handleDeleteItem(materia.id)}
                  >
                    <Feather name="trash-2" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )
      case "grupos":
        return (
          <ScrollView style={styles.tabContent}>
            {grupos.map((grupo) => {
              const docente = docentes.find((d) => d.id === grupo.docenteId)
              return (
                <View
                  key={grupo.id}
                  style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{grupo.nombre}</Text>
                    <Text style={[styles.itemSubtitle, { color: colors.secondary }]}>
                      Docente: {docente ? `${docente.nombre} ${docente.apellido}` : "No asignado"}
                    </Text>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity 
                      style={[styles.editButton, { backgroundColor: colors.primary }]} 
                      onPress={() => handleEditItem(grupo.id)}
                    >
                      <Feather name="edit-2" size={16} color="#ffffff" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.deleteButton, { backgroundColor: "#dc3545" }]} 
                      onPress={() => handleDeleteItem(grupo.id)}
                    >
                      <Feather name="trash-2" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })}
          </ScrollView>
        )
      case "directivos":
        return (
          <ScrollView style={styles.tabContent}>
            {directivos.map((directivo) => (
              <View
                key={directivo.id}
                style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>{directivo.nombre}</Text>
                  <Text style={[styles.itemSubtitle, { color: colors.secondary }]}>
                    Puesto:{" "}
                    {directivo.rol === "Director"
                      ? directivo.generoFemenino
                        ? "Directora"
                        : "Director"
                      : directivo.generoFemenino
                        ? "Subdirectora Académica"
                        : "Subdirector Académico"}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity 
                    style={[styles.editButton, { backgroundColor: colors.primary }]} 
                    onPress={() => handleEditItem(directivo.id)}
                  >
                    <Feather name="edit-2" size={16} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.deleteButton, { backgroundColor: "#dc3545" }]} 
                    onPress={() => handleDeleteItem(directivo.id)}
                  >
                    <Feather name="trash-2" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )
      default:
        return null
    }
  }

  const renderForm = () => {
    switch (activeTab) {
      case "docentes":
        return (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Nombre"
              placeholderTextColor={colors.secondary}
              value={docenteForm.nombre}
              onChangeText={(text) => setDocenteForm({ ...docenteForm, nombre: text })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Apellido"
              placeholderTextColor={colors.secondary}
              value={docenteForm.apellido}
              onChangeText={(text) => setDocenteForm({ ...docenteForm, apellido: text })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.secondary}
              value={docenteForm.email}
              onChangeText={(text) => setDocenteForm({ ...docenteForm, email: text })}
              keyboardType="email-address"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Número de Empleado"
              placeholderTextColor={colors.secondary}
              value={docenteForm.numeroEmpleado}
              onChangeText={(text) => setDocenteForm({ ...docenteForm, numeroEmpleado: text })}
              keyboardType="number-pad"
            />
          </>
        )
      case "materias":
        return (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Nombre de la Materia"
              placeholderTextColor={colors.secondary}
              value={materiaForm.nombre}
              onChangeText={(text) => setMateriaForm({ ...materiaForm, nombre: text })}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Siglas"
              placeholderTextColor={colors.secondary}
              value={materiaForm.siglas}
              onChangeText={(text) => setMateriaForm({ ...materiaForm, siglas: text })}
            />
          </>
        )
      case "grupos":
        return (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Nombre del Grupo"
              placeholderTextColor={colors.secondary}
              value={grupoForm.nombre}
              onChangeText={(text) => setGrupoForm({ ...grupoForm, nombre: text })}
            />
            <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
              <Text style={[styles.pickerLabel, { color: colors.text }]}>Seleccione un Docente:</Text>
              <ScrollView style={styles.pickerScrollView}>
                {docentes.map((docente) => (
                  <TouchableOpacity
                    key={docente.id}
                    style={[
                      styles.pickerItem,
                      grupoForm.docenteId === docente.id && { backgroundColor: colors.primary + "40" },
                    ]}
                    onPress={() => setGrupoForm({ ...grupoForm, docenteId: docente.id })}
                  >
                    <Text style={{ color: colors.text }}>
                      {docente.nombre} {docente.apellido}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )
      case "directivos":
        return (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Nombre Completo"
              placeholderTextColor={colors.secondary}
              value={directivoForm.nombre}
              onChangeText={(text) => setDirectivoForm({ ...directivoForm, nombre: text })}
            />
            <View style={styles.radioGroup}>
              <Text style={[styles.radioLabel, { color: colors.text }]}>Puesto:</Text>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  directivoForm.rol === "Director" && { backgroundColor: colors.primary + "40" },
                ]}
                onPress={() => setDirectivoForm({ ...directivoForm, rol: "Director" })}
              >
                <Text style={{ color: colors.text }}>Director(a)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  directivoForm.rol === "Subdirector Académico" && { backgroundColor: colors.primary + "40" },
                ]}
                onPress={() => setDirectivoForm({ ...directivoForm, rol: "Subdirector Académico" })}
              >
                <Text style={{ color: colors.text }}>Subdirector(a) Académico(a)</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.radioGroup}>
              <Text style={[styles.radioLabel, { color: colors.text }]}>Género:</Text>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  !directivoForm.generoFemenino && { backgroundColor: colors.primary + "40" },
                ]}
                onPress={() => setDirectivoForm({ ...directivoForm, generoFemenino: false })}
              >
                <Text style={{ color: colors.text }}>Masculino</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, directivoForm.generoFemenino && { backgroundColor: colors.primary + "40" }]}
                onPress={() => setDirectivoForm({ ...directivoForm, generoFemenino: true })}
              >
                <Text style={{ color: colors.text }}>Femenino</Text>
              </TouchableOpacity>
            </View>
          </>
        )
      default:
        return null
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "docentes" && [styles.activeTab, { borderColor: colors.primary }]]}
            onPress={() => setActiveTab("docentes")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "docentes" && [styles.activeTabText, { color: colors.primary }],
                { color: activeTab === "docentes" ? colors.primary : colors.text },
              ]}
            >
              Docentes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "materias" && [styles.activeTab, { borderColor: colors.primary }]]}
            onPress={() => setActiveTab("materias")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "materias" && [styles.activeTabText, { color: colors.primary }],
                { color: activeTab === "materias" ? colors.primary : colors.text },
              ]}
            >
              Materias
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "grupos" && [styles.activeTab, { borderColor: colors.primary }]]}
            onPress={() => setActiveTab("grupos")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "grupos" && [styles.activeTabText, { color: colors.primary }],
                { color: activeTab === "grupos" ? colors.primary : colors.text },
              ]}
            >
              Grupos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "directivos" && [styles.activeTab, { borderColor: colors.primary }]]}
            onPress={() => setActiveTab("directivos")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "directivos" && [styles.activeTabText, { color: colors.primary }],
                { color: activeTab === "directivos" ? colors.primary : colors.text },
              ]}
            >
              Directivos
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {activeTab === "docentes" && "Docentes"}
            {activeTab === "materias" && "Materias"}
            {activeTab === "grupos" && "Grupos"}
            {activeTab === "directivos" && "Directivos"}
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              resetForms()
              setModalVisible(true)
            }}
          >
            <Feather name="plus" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {renderTabContent()}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isEditing ? (
                <>
                  {activeTab === "docentes" && "Editar Docente"}
                  {activeTab === "materias" && "Editar Materia"}
                  {activeTab === "grupos" && "Editar Grupo"}
                  {activeTab === "directivos" && "Editar Directivo"}
                </>
              ) : (
                <>
                  {activeTab === "docentes" && "Agregar Docente"}
                  {activeTab === "materias" && "Agregar Materia"}
                  {activeTab === "grupos" && "Agregar Grupo"}
                  {activeTab === "directivos" && "Agregar Directivo"}
                </>
              )}
            </Text>

            {renderForm()}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.secondary }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleAddItem}
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
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  tabsScroll: {
    flexDirection: "row",
  },
  tab: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
  },
  activeTabText: {
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
    padding: 15,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  tabContent: {
    flex: 1,
  },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  itemSubtitle: {
    fontSize: 14,
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 5,
    marginBottom: 10,
    padding: 10,
  },
  pickerLabel: {
    marginBottom: 5,
    fontWeight: "bold",
  },
  pickerScrollView: {
    maxHeight: 150,
  },
  pickerItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  radioGroup: {
    marginBottom: 10,
  },
  radioLabel: {
    marginBottom: 5,
    fontWeight: "bold",
  },
  radioButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 5,
    marginBottom: 5,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
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

export default ManagementScreen
