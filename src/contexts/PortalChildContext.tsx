import { createContext, useContext, useState, ReactNode } from 'react'

interface PortalChildContextType {
  selectedChild: number | null
  setSelectedChild: (id: number | null) => void
}

const PortalChildContext = createContext<PortalChildContextType>({
  selectedChild: null,
  setSelectedChild: () => {},
})

export function PortalChildProvider({ children }: { children: ReactNode }) {
  const [selectedChild, setSelectedChild] = useState<number | null>(null)
  return (
    <PortalChildContext.Provider value={{ selectedChild, setSelectedChild }}>
      {children}
    </PortalChildContext.Provider>
  )
}

export const usePortalChild = () => useContext(PortalChildContext)
