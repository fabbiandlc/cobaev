"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Tipos de datos
export interface Docente {
  id: string
  nombre: string
  apellido: string
  email: string
  numeroEmpleado: string
}

export interface Materia {
  id: string
  nombre: string
  siglas: string
}

export interface Grupo {
  id: string
  nombre: string
  docenteId: string
}

export interface Directivo {
  id: string
  nombre: string
  rol: "Director" | "Subdirector Académico"
  generoFemenino: boolean
}

export interface Horario {
  id: string
  dia: string
  horaInicio: string
  horaFin: string
  materiaId: string
  docenteId: string
  salonId: string // ID del grupo
}

export interface Actividad {
  id: string
  titulo: string
  descripcion: string
  fecha: string
  horaInicio: string
  horaFin: string
  color: string
}

interface DataContextType {
  docentes: Docente[]
  materias: Materia[]
  grupos: Grupo[]
  directivos: Directivo[]
  horarios: Horario[]
  actividades: Actividad[]
  addDocente: (docente: Omit<Docente, "id">) => void
  addMateria: (materia: Omit<Materia, "id">) => void
  addGrupo: (grupo: Omit<Grupo, "id">) => void
  addDirectivo: (directivo: Omit<Directivo, "id">) => void
  addHorario: (horario: Omit<Horario, "id">) => void
  addActividad: (actividad: Omit<Actividad, "id">) => void
  updateDocente: (id: string, docente: Partial<Docente>) => void
  updateMateria: (id: string, materia: Partial<Materia>) => void
  updateGrupo: (id: string, grupo: Partial<Grupo>) => void
  updateDirectivo: (id: string, directivo: Partial<Directivo>) => void
  updateHorario: (id: string, horario: Partial<Horario>) => void
  updateActividad: (id: string, actividad: Partial<Actividad>) => void
  deleteDocente: (id: string) => void
  deleteMateria: (id: string) => void
  deleteGrupo: (id: string) => void
  deleteDirectivo: (id: string) => void
  deleteHorario: (id: string) => void
  deleteActividad: (id: string) => void
  getDocenteById: (id: string) => Docente | undefined
  getMateriaById: (id: string) => Materia | undefined
  getGrupoById: (id: string) => Grupo | undefined
  getDirectivoById: (id: string) => Directivo | undefined
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [directivos, setDirectivos] = useState<Directivo[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])

  // Cargar datos al iniciar
  useEffect(() => {
    const loadData = async () => {
      try {
        const docentesData = await AsyncStorage.getItem("docentes")
        if (docentesData) setDocentes(JSON.parse(docentesData))

        const materiasData = await AsyncStorage.getItem("materias")
        if (materiasData) setMaterias(JSON.parse(materiasData))

        const gruposData = await AsyncStorage.getItem("grupos")
        if (gruposData) setGrupos(JSON.parse(gruposData))

        const directivosData = await AsyncStorage.getItem("directivos")
        if (directivosData) setDirectivos(JSON.parse(directivosData))

        const horariosData = await AsyncStorage.getItem("horarios")
        if (horariosData) setHorarios(JSON.parse(horariosData))

        const actividadesData = await AsyncStorage.getItem("actividades")
        if (actividadesData) setActividades(JSON.parse(actividadesData))
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    loadData()
  }, [])

  // Guardar datos cuando cambien
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("docentes", JSON.stringify(docentes))
      } catch (error) {
        console.error("Error saving docentes:", error)
      }
    }
    saveData()
  }, [docentes])

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("materias", JSON.stringify(materias))
      } catch (error) {
        console.error("Error saving materias:", error)
      }
    }
    saveData()
  }, [materias])

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("grupos", JSON.stringify(grupos))
      } catch (error) {
        console.error("Error saving grupos:", error)
      }
    }
    saveData()
  }, [grupos])

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("directivos", JSON.stringify(directivos))
      } catch (error) {
        console.error("Error saving directivos:", error)
      }
    }
    saveData()
  }, [directivos])

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("horarios", JSON.stringify(horarios))
      } catch (error) {
        console.error("Error saving horarios:", error)
      }
    }
    saveData()
  }, [horarios])

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("actividades", JSON.stringify(actividades))
      } catch (error) {
        console.error("Error saving actividades:", error)
      }
    }
    saveData()
  }, [actividades])

  // Funciones para agregar datos
  const addDocente = (docente: Omit<Docente, "id">) => {
    const newDocente = { ...docente, id: Date.now().toString() }
    setDocentes([...docentes, newDocente])
  }

  const addMateria = (materia: Omit<Materia, "id">) => {
    const newMateria = { ...materia, id: Date.now().toString() }
    setMaterias([...materias, newMateria])
  }

  const addGrupo = (grupo: Omit<Grupo, "id">) => {
    const newGrupo = { ...grupo, id: Date.now().toString() }
    setGrupos([...grupos, newGrupo])
  }

  const addDirectivo = (directivo: Omit<Directivo, "id">) => {
    const newDirectivo = { ...directivo, id: Date.now().toString() }
    setDirectivos([...directivos, newDirectivo])
  }

  const addHorario = (horario: Omit<Horario, "id">) => {
    const newHorario = { ...horario, id: Date.now().toString() }
    setHorarios([...horarios, newHorario])
  }

  const addActividad = (actividad: Omit<Actividad, "id">) => {
    const newActividad = { ...actividad, id: Date.now().toString() }
    setActividades([...actividades, newActividad])
  }

  // Funciones para actualizar datos
  const updateDocente = (id: string, docente: Partial<Docente>) => {
    setDocentes(docentes.map((d) => (d.id === id ? { ...d, ...docente } : d)))
  }

  const updateMateria = (id: string, materia: Partial<Materia>) => {
    setMaterias(materias.map((m) => (m.id === id ? { ...m, ...materia } : m)))
  }

  const updateGrupo = (id: string, grupo: Partial<Grupo>) => {
    setGrupos(grupos.map((g) => (g.id === id ? { ...g, ...grupo } : g)))
  }

  const updateDirectivo = (id: string, directivo: Partial<Directivo>) => {
    setDirectivos(directivos.map((d) => (d.id === id ? { ...d, ...directivo } : d)))
  }

  const updateHorario = (id: string, horario: Partial<Horario>) => {
    setHorarios(horarios.map((h) => (h.id === id ? { ...h, ...horario } : h)))
  }

  const updateActividad = (id: string, actividad: Partial<Actividad>) => {
    setActividades(actividades.map((a) => (a.id === id ? { ...a, ...actividad } : a)))
  }

  // Funciones para eliminar datos
  const deleteDocente = (id: string) => {
    setDocentes(docentes.filter((d) => d.id !== id))
  }

  const deleteMateria = (id: string) => {
    setMaterias(materias.filter((m) => m.id !== id))
  }

  const deleteGrupo = (id: string) => {
    setGrupos(grupos.filter((g) => g.id !== id))
  }

  const deleteDirectivo = (id: string) => {
    setDirectivos(directivos.filter((d) => d.id !== id))
  }

  const deleteHorario = (id: string) => {
    setHorarios(horarios.filter((h) => h.id !== id))
  }

  const deleteActividad = (id: string) => {
    setActividades(actividades.filter((a) => a.id !== id))
  }

  // Funciones para obtener datos por ID
  const getDocenteById = (id: string) => {
    return docentes.find((d) => d.id === id)
  }

  const getMateriaById = (id: string) => {
    return materias.find((m) => m.id === id)
  }

  const getGrupoById = (id: string) => {
    return grupos.find((g) => g.id === id)
  }

  const getDirectivoById = (id: string) => {
    return directivos.find((d) => d.id === id)
  }

  return (
    <DataContext.Provider
      value={{
        docentes,
        materias,
        grupos,
        directivos,
        horarios,
        actividades,
        addDocente,
        addMateria,
        addGrupo,
        addDirectivo,
        addHorario,
        addActividad,
        updateDocente,
        updateMateria,
        updateGrupo,
        updateDirectivo,
        updateHorario,
        updateActividad,
        deleteDocente,
        deleteMateria,
        deleteGrupo,
        deleteDirectivo,
        deleteHorario,
        deleteActividad,
        getDocenteById,
        getMateriaById,
        getGrupoById,
        getDirectivoById,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
