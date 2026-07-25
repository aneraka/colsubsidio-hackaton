import { createContext, useContext, useState, type ReactNode } from "react";
import { initialArticulos, type Articulo } from "@/data/inventory";

interface InventoryContextValue {
  articulos: Articulo[];
  addArticulo: (a: Omit<Articulo, "id">) => void;
  updateArticulo: (id: string, a: Omit<Articulo, "id">) => void;
  deleteArticulo: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [articulos, setArticulos] = useState<Articulo[]>(initialArticulos);

  const addArticulo = (a: Omit<Articulo, "id">) =>
    setArticulos((prev) => [...prev, { ...a, id: crypto.randomUUID() }]);

  const updateArticulo = (id: string, a: Omit<Articulo, "id">) =>
    setArticulos((prev) => prev.map((it) => (it.id === id ? { ...a, id } : it)));

  const deleteArticulo = (id: string) =>
    setArticulos((prev) => prev.filter((it) => it.id !== id));

  return (
    <InventoryContext.Provider value={{ articulos, addArticulo, updateArticulo, deleteArticulo }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}
