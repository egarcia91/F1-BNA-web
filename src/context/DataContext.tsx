import { createContext, useContext, type ReactNode } from 'react'
import type { Corredor, Torneo } from '../types'
import { usePilotos } from '../hooks/usePilotos'
import { useTorneos } from '../hooks/useTorneos'

interface DataContextValue {
  pilotos: Corredor[]
  torneos: Torneo[]
  loading: boolean
  error: string | null
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { pilotos, loading: loadingP, error: errorP } = usePilotos()
  const { torneos, loading: loadingT, error: errorT } = useTorneos()

  const loading = loadingP || loadingT
  const error = errorP ?? errorT

  const value: DataContextValue = {
    pilotos,
    torneos,
    loading,
    error,
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider')
  return ctx
}
