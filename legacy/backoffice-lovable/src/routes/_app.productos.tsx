import { useMemo, useRef, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Loader2, Pencil, Plus, Tags, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { flagDenied } from "@/lib/access";

interface CategoryRow {
  id: string;
  name: string;
}

interface ProductRow {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  max_stock: number | null;
  cost_per_unit: number | null;
  category_id: string | null;
  categories: { name: string } | null;
}

const UNIT_OPTIONS = [
  "Kg",
  "Gramos",
  "Litros",
  "ml",
  "Unidades",
  "Bloque",
  "Bowl",
  "Frasco Cafe",
  "Frasco Grande",
  "Paquete",
];

export const Route = createFileRoute("/_app/productos")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
    const { data } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
    const role = data?.role;
    if (role !== "super_admin" && role !== "admin") {
      flagDenied();
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Catálogo de Productos — La Cocina" },
      { name: "description", content: "Catálogo maestro de productos." },
    ],
  }),
  component: ProductosPage,
});

function formatCurrency(n: number | null) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

function ProductosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [productDialog, setProductDialog] = useState<{ mode: "create" } | { mode: "edit"; product: ProductRow } | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as CategoryRow[];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, unit, current_stock, min_stock, max_stock, cost_per_unit, category_id, categories(name)")
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as ProductRow[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Producto eliminado");
      qc.invalidateQueries({ queryKey: ["products"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message ?? "Error al eliminar"),
  });

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (categoryFilter !== "all" && p.category_id !== categoryFilter) return false;
      return true;
    });
  }, [products, search, categoryFilter]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Catálogo de Productos</h1>
          <p className="text-sm text-muted-foreground">Gestión maestra de productos, categorías y costos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoriesOpen(true)}>
            <Tags className="h-4 w-4 mr-2" />
            Gestionar categorías
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar Excel
          </Button>
          <Button
            onClick={() => setProductDialog({ mode: "create" })}
            disabled={!categories?.length}
            title={!categories?.length ? "Crea al menos una categoría primero" : undefined}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Stock Actual</TableHead>
              <TableHead className="text-right">Stock Mínimo</TableHead>
              <TableHead className="text-right">Stock Máximo</TableHead>
              <TableHead className="text-right">Costo Unit.</TableHead>
              <TableHead className="w-[140px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || catsLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : !filtered.length ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  {products?.length
                    ? "No hay productos que coincidan con el filtro."
                    : "Aún no hay productos. Crea el primero."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const isLow = Number(p.current_stock) <= Number(p.min_stock);
                const isHigh = p.max_stock !== null && Number(p.current_stock) >= Number(p.max_stock);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      {p.categories?.name ? (
                        <Badge variant="secondary">{p.categories.name}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin categoría</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.unit}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <span
                          className={
                            isLow
                              ? "text-destructive font-semibold"
                              : isHigh
                                ? "text-amber-600 font-semibold"
                                : undefined
                          }
                        >
                          {Number(p.current_stock)}
                        </span>
                        {isLow && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                            Stock Bajo
                          </Badge>
                        )}
                        {!isLow && isHigh && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                            Stock Alto
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{Number(p.min_stock)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {p.max_stock !== null ? Number(p.max_stock) : "—"}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(p.cost_per_unit)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProductDialog({ mode: "edit", product: p })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTarget(p)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <ProductDialog state={productDialog} onClose={() => setProductDialog(null)} categories={categories ?? []} />

      <DeleteProductDialog
        target={deleteTarget}
        pending={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />

      <ManageCategoriesDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} categories={categories ?? []} />

      <ImportProductsDialog open={importOpen} onOpenChange={setImportOpen} categories={categories ?? []} />
    </div>
  );
}

function ProductDialog({
  state,
  onClose,
  categories,
}: {
  state: { mode: "create" } | { mode: "edit"; product: ProductRow } | null;
  onClose: () => void;
  categories: CategoryRow[];
}) {
  const qc = useQueryClient();
  const isEdit = state?.mode === "edit";
  const product = isEdit ? state.product : null;

  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState<string>(product?.category_id ?? "");
  const [unit, setUnit] = useState<string>(product?.unit ?? "");
  const [minStock, setMinStock] = useState<string>(product ? String(product.min_stock) : "5");
  const [maxStock, setMaxStock] = useState<string>(
    product?.max_stock !== null && product?.max_stock !== undefined ? String(product.max_stock) : "",
  );
  const [cost, setCost] = useState<string>(
    product?.cost_per_unit !== null && product?.cost_per_unit !== undefined ? String(product.cost_per_unit) : "",
  );

  // Reset form when target changes
  useMemo(() => {
    if (!state) return;
    if (state.mode === "edit") {
      const p = state.product;
      setName(p.name);
      setCategoryId(p.category_id ?? "");
      setUnit(p.unit);
      setMinStock(String(p.min_stock));
      setMaxStock(p.max_stock !== null && p.max_stock !== undefined ? String(p.max_stock) : "");
      setCost(p.cost_per_unit !== null && p.cost_per_unit !== undefined ? String(p.cost_per_unit) : "");
    } else {
      setName("");
      setCategoryId("");
      setUnit("");
      setMinStock("5");
      setMaxStock("");
      setCost("");
    }
  }, [state]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        category_id: categoryId || null,
        unit,
        min_stock: Number(minStock) || 0,
        max_stock: maxStock.trim() === "" ? null : Number(maxStock),
        cost_per_unit: cost.trim() === "" ? null : Number(cost),
      };
      if (isEdit && product) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert({
          ...payload,
          current_stock: 0,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Producto actualizado" : "Producto creado");
      qc.invalidateQueries({ queryKey: ["products"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message ?? "Error al guardar"),
  });

  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Actualiza los datos del producto." : "Agrega un nuevo producto al catálogo."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return toast.error("El nombre es obligatorio.");
            if (!categoryId) return toast.error("Selecciona una categoría.");
            if (!unit) return toast.error("Selecciona una unidad.");
            if (maxStock.trim() !== "" && Number(maxStock) < Number(minStock)) {
              return toast.error("El stock máximo no puede ser menor que el stock mínimo.");
            }
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="prod-name">Nombre</Label>
            <Input id="prod-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prod-cat">Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="prod-cat">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-unit">Unidad</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="prod-unit">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prod-min">Stock Mínimo</Label>
              <Input
                id="prod-min"
                type="number"
                min={0}
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-max">Stock Máximo</Label>
              <Input
                id="prod-max"
                type="number"
                min={0}
                value={maxStock}
                onChange={(e) => setMaxStock(e.target.value)}
                placeholder="Sin límite"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-cost">Costo Unitario</Label>
              <Input
                id="prod-cost"
                type="number"
                min={0}
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prod-stock">Stock Actual</Label>
            <Input id="prod-stock" type="number" disabled value={isEdit ? product!.current_stock : 0} />
            <p className="text-xs text-muted-foreground">El stock se modifica desde Operaciones de Inventario.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProductDialog({
  target,
  pending,
  onCancel,
  onConfirm,
}: {
  target: ProductRow | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={!!target} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente <strong>{target?.name}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ManageCategoriesDialog({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: CategoryRow[];
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("categories").insert({ name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoría creada");
      setName("");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Error al crear categoría"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoría eliminada");
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setDeleteTarget(null);
    },
    onError: (e: { code?: string; message?: string }) => {
      if (e?.code === "23503") {
        toast.error("No se puede eliminar: la categoría está en uso");
      } else {
        toast.error(e?.message ?? "Error al eliminar categoría");
      }
      setDeleteTarget(null);
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestionar categorías</DialogTitle>
            <DialogDescription>Agrega o elimina las categorías usadas para clasificar los productos.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              createMutation.mutate();
            }}
            className="flex gap-2"
          >
            <Input placeholder="Nueva categoría…" value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Agregar
            </Button>
          </form>

          <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
            {categories.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">Aún no hay categorías.</div>
            ) : (
              categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm">{c.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(c)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteTarget?.name}</strong>. Esta acción fallará si la categoría está asignada a
              productos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface ParsedRow {
  rowNum: number;
  name: string;
  category: string;
  unit: string;
  min_stock: number;
  max_stock: number | null;
  cost_per_unit: number | null;
  errors: string[];
}

function ImportProductsDialog({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: CategoryRow[];
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");

  const reset = () => {
    setRows([]);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const headers = ["Nombre", "Categoría", "Unidad", "Stock_Minimo", "Stock_Maximo", "Costo_Unitario"];
    const examples = [
      ["Tomate", "Verduras", "Kg", 10, 50, 2500],
      ["Aceite de oliva", "Abarrotes", "Litros", 5, 30, 28000],
      ["Pollo entero", "Carnes", "Unidades", 8, 40, 18000],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);
    ws["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, "Productos");

    const instr = [
      ["Instrucciones para cargar productos"],
      [],
      ["Columna", "Obligatorio", "Descripción"],
      ["Nombre", "Sí", "Nombre único del producto."],
      ["Categoría", "Sí", "Si la categoría no existe, se creará automáticamente."],
      ["Unidad", "Sí", `Una de: ${UNIT_OPTIONS.join(", ")}.`],
      ["Stock_Minimo", "No", "Número entero. Por defecto 5 si se deja vacío."],
      ["Stock_Maximo", "No", "Número entero. Déjalo vacío si no quieres definir un tope."],
      ["Costo_Unitario", "No", "Costo por unidad en COP. Solo número, sin símbolos."],
      [],
      ["Notas:"],
      ["• El stock actual de cada producto comenzará en 0."],
      ["• Para cargar el stock real usa el módulo 'Operaciones de Inventario'."],
      ["• Borra las filas de ejemplo antes de importar tus productos reales."],
    ];
    const wsi = XLSX.utils.aoa_to_sheet(instr);
    wsi["!cols"] = [{ wch: 22 }, { wch: 14 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(wb, wsi, "Instrucciones");

    XLSX.writeFile(wb, "plantilla_productos.xlsx");
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames.includes("Productos") ? "Productos" : wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

      const validUnits = new Set(UNIT_OPTIONS.map((u) => u.toLowerCase()));
      const parsed: ParsedRow[] = json.map((r, i) => {
        const errors: string[] = [];
        const name = String(r["Nombre"] ?? "").trim();
        const category = String(r["Categoría"] ?? r["Categoria"] ?? "").trim();
        const unitRaw = String(r["Unidad"] ?? "").trim();
        const unit = UNIT_OPTIONS.find((u) => u.toLowerCase() === unitRaw.toLowerCase()) ?? unitRaw;
        const minStockRaw = r["Stock_Minimo"];
        const maxStockRaw = r["Stock_Maximo"];
        const costRaw = r["Costo_Unitario"];

        if (!name) errors.push("Nombre vacío");
        if (!category) errors.push("Categoría vacía");
        if (!unitRaw) errors.push("Unidad vacía");
        else if (!validUnits.has(unitRaw.toLowerCase()))
          errors.push(`Unidad inválida (use: ${UNIT_OPTIONS.join(", ")})`);

        let min_stock = 5;
        if (minStockRaw !== "" && minStockRaw !== null && minStockRaw !== undefined) {
          const n = Number(minStockRaw);
          if (Number.isNaN(n)) errors.push("Stock_Minimo no numérico");
          else min_stock = n;
        }

        let max_stock: number | null = null;
        if (maxStockRaw !== "" && maxStockRaw !== null && maxStockRaw !== undefined) {
          const n = Number(maxStockRaw);
          if (Number.isNaN(n)) errors.push("Stock_Maximo no numérico");
          else max_stock = n;
        }
        if (max_stock !== null && max_stock < min_stock) {
          errors.push("Stock_Maximo menor que Stock_Minimo");
        }

        let cost_per_unit: number | null = null;
        if (costRaw !== "" && costRaw !== null && costRaw !== undefined) {
          const n = Number(costRaw);
          if (Number.isNaN(n)) errors.push("Costo_Unitario no numérico");
          else cost_per_unit = n;
        }

        return { rowNum: i + 2, name, category, unit, min_stock, max_stock, cost_per_unit, errors };
      });

      setRows(parsed);
      if (!parsed.length) toast.warning("El archivo no contiene filas.");
    } catch (e) {
      toast.error(`No se pudo leer el archivo: ${(e as Error).message}`);
      reset();
    }
  };

  const validRows = rows.filter((r) => r.errors.length === 0);
  const errorRows = rows.filter((r) => r.errors.length > 0);

  const importMutation = useMutation({
    mutationFn: async () => {
      // 1. Resolve categories (create missing)
      const catMap = new Map<string, string>();
      categories.forEach((c) => catMap.set(c.name.toLowerCase(), c.id));

      const neededNames = Array.from(
        new Set(validRows.map((r) => r.category).filter((n) => !catMap.has(n.toLowerCase()))),
      );

      if (neededNames.length) {
        const { data: inserted, error } = await supabase
          .from("categories")
          .insert(neededNames.map((name) => ({ name })))
          .select("id, name");
        if (error) throw error;
        (inserted ?? []).forEach((c) => catMap.set(c.name.toLowerCase(), c.id));
      }

      // 2. Insert products
      const payload = validRows.map((r) => ({
        name: r.name,
        category_id: catMap.get(r.category.toLowerCase()) ?? null,
        unit: r.unit,
        min_stock: r.min_stock,
        max_stock: r.max_stock,
        cost_per_unit: r.cost_per_unit,
        current_stock: 0,
      }));
      const { error: pErr } = await supabase.from("products").insert(payload);
      if (pErr) throw pErr;
      return validRows.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} producto(s) importado(s) correctamente`);
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message ?? "Error al importar productos"),
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar productos desde Excel</DialogTitle>
          <DialogDescription>
            Descarga la plantilla, llénala en Excel y súbela aquí para crear varios productos a la vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Descargar plantilla
            </Button>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Seleccionar archivo
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {fileName && (
              <span className="text-sm text-muted-foreground self-center truncate max-w-[200px]">{fileName}</span>
            )}
          </div>

          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex gap-2 text-sm">
                <Badge variant="secondary">Total: {rows.length}</Badge>
                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/15">
                  Válidos: {validRows.length}
                </Badge>
                {errorRows.length > 0 && (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                    Con errores: {errorRows.length}
                  </Badge>
                )}
              </div>

              <div className="border rounded-md max-h-[260px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Fila</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.rowNum}>
                        <TableCell className="text-muted-foreground">{r.rowNum}</TableCell>
                        <TableCell className="font-medium">{r.name || "—"}</TableCell>
                        <TableCell>{r.category || "—"}</TableCell>
                        <TableCell>{r.unit || "—"}</TableCell>
                        <TableCell>
                          {r.errors.length === 0 ? (
                            <Badge variant="secondary">OK</Badge>
                          ) : (
                            <span className="text-xs text-destructive">{r.errors.join(", ")}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={importMutation.isPending}>
            Cancelar
          </Button>
          <Button disabled={!validRows.length || importMutation.isPending} onClick={() => importMutation.mutate()}>
            {importMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Importar {validRows.length || ""} producto{validRows.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
