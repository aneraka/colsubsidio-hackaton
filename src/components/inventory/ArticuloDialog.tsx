import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIAS,
  UNIDADES,
  type Articulo,
  type Categoria,
  type Unidad,
} from "@/data/inventory";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Articulo | null;
  onSubmit: (data: Omit<Articulo, "id">) => void;
}

export function ArticuloDialog({ open, onOpenChange, initial, onSubmit }: Props) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Carnes");
  const [cantidad, setCantidad] = useState<number>(0);
  const [unidad, setUnidad] = useState<Unidad>("Kg");
  const [costoUnitario, setCostoUnitario] = useState<number>(0);

  useEffect(() => {
    if (open) {
      setNombre(initial?.nombre ?? "");
      setCategoria(initial?.categoria ?? "Carnes");
      setCantidad(initial?.cantidad ?? 0);
      setUnidad(initial?.unidad ?? "Kg");
      setCostoUnitario(initial?.costoUnitario ?? 0);
    }
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSubmit({ nombre: nombre.trim(), categoria, cantidad, unidad, costoUnitario });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar artículo" : "Nuevo artículo"}</DialogTitle>
          <DialogDescription>
            {initial ? "Actualiza los datos del ingrediente." : "Agrega un nuevo ingrediente al inventario."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Tomate cherry"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as Categoria)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select value={unidad} onValueChange={(v) => setUnidad(v as Unidad)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                type="number"
                min={0}
                step="0.01"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costo">Costo unitario ($)</Label>
              <Input
                id="costo"
                type="number"
                min={0}
                step="0.01"
                value={costoUnitario}
                onChange={(e) => setCostoUnitario(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{initial ? "Guardar cambios" : "Agregar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
