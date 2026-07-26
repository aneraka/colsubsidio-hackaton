import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  ChevronsUpDown,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export const Route = createFileRoute("/_app/inventario")({
  head: () => ({
    meta: [
      { title: "Operaciones de Inventario — La Cocina" },
      { name: "description", content: "Registro de movimientos de stock." },
    ],
  }),
  component: InventarioPage,
});

interface ProductMinimal {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  category_id: string | null;
}

interface CategoryRow {
  id: string;
  name: string;
}

interface InventoryLogRow {
  id: string;
  type: "entrada" | "salida" | "conteo_manual";
  quantity: number;
  theoretical_stock: number | null;
  discrepancy: number | null;
  notes: string | null;
  created_at: string | null;
  products: { name: string; unit: string } | null;
  profiles: { email: string } | null;
}

const TYPE_BADGE: Record<
  InventoryLogRow["type"],
  { label: string; className: string }
> = {
  entrada: {
    label: "Entrada",
    className:
      "bg-[oklch(0.62_0.15_145)/0.12] text-[oklch(0.45_0.15_145)] border-[oklch(0.62_0.15_145)/0.35]",
  },
  salida: {
    label: "Salida",
    className: "bg-destructive/12 text-destructive border-destructive/35",
  },
  conteo_manual: {
    label: "Conteo",
    className: "bg-blue-500/12 text-blue-600 border-blue-500/35 dark:text-blue-400",
  },
};

const ALL_CATEGORIES = "__all__";

function InventarioPage() {
  const { user } = useAuth();

  const productsQuery = useQuery({
    queryKey: ["products_minimal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, unit, current_stock, category_id")
        .order("name");
      if (error) throw error;
      return (data ?? []) as ProductMinimal[];
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return (data ?? []) as CategoryRow[];
    },
  });

  const logsQuery = useQuery({
    queryKey: ["inventory_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_logs")
        .select(
          "id, type, quantity, theoretical_stock, discrepancy, notes, created_at, products(name, unit), profiles(email)",
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as InventoryLogRow[];
    },
  });

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Operaciones de Inventario
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra entradas, salidas y conteos físicos de stock.
        </p>
      </div>

      <Tabs defaultValue="entrada" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl h-auto">
          <TabsTrigger value="entrada" className="gap-2 py-2">
            <ArrowDownCircle className="h-4 w-4" />
            Entrada de Stock
          </TabsTrigger>
          <TabsTrigger value="salida" className="gap-2 py-2">
            <ArrowUpCircle className="h-4 w-4" />
            Salida de Stock
          </TabsTrigger>
          <TabsTrigger value="conteo" className="gap-2 py-2">
            <ClipboardCheck className="h-4 w-4" />
            Conteo Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entrada">
          <MovementForm
            type="entrada"
            products={products}
            categories={categories}
            loadingProducts={productsQuery.isLoading}
            userId={user?.id ?? null}
          />
        </TabsContent>
        <TabsContent value="salida">
          <MovementForm
            type="salida"
            products={products}
            categories={categories}
            loadingProducts={productsQuery.isLoading}
            userId={user?.id ?? null}
          />
        </TabsContent>
        <TabsContent value="conteo">
          <ConteoForm
            products={products}
            categories={categories}
            loadingProducts={productsQuery.isLoading}
            userId={user?.id ?? null}
          />
        </TabsContent>
      </Tabs>

      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Historial reciente</h2>
          <p className="text-xs text-muted-foreground">
            Últimos 50 movimientos registrados.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Fecha</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Merma/Diferencia</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin inline" />
                  </TableCell>
                </TableRow>
              ) : (logsQuery.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-10"
                  >
                    Aún no hay movimientos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                (logsQuery.data ?? []).map((log) => {
                  const badge = TYPE_BADGE[log.type];
                  const disc = log.discrepancy ?? 0;
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {log.created_at
                          ? format(new Date(log.created_at), "dd/MM/yy HH:mm")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.profiles?.email ?? "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.products?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badge.className}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(log.quantity)} {log.products?.unit ?? ""}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {log.type === "conteo_manual" ? (
                          <span
                            className={
                              disc < 0
                                ? "text-destructive"
                                : disc > 0
                                  ? "text-[oklch(0.45_0.15_145)]"
                                  : "text-muted-foreground"
                            }
                          >
                            {disc > 0 ? "+" : ""}
                            {disc}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {log.notes ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

interface FormCommonProps {
  products: ProductMinimal[];
  categories: CategoryRow[];
  loadingProducts: boolean;
  userId: string | null;
}

interface CategoryAndProductPickerProps {
  products: ProductMinimal[];
  categories: CategoryRow[];
  loadingProducts: boolean;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  productId: string;
  onProductChange: (value: string) => void;
  showStockHint?: boolean;
}

function CategoryAndProductPicker({
  products,
  categories,
  loadingProducts,
  categoryId,
  onCategoryChange,
  productId,
  onProductChange,
  showStockHint = true,
}: CategoryAndProductPickerProps) {
  const [open, setOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (categoryId === ALL_CATEGORIES) return products;
    return products.filter((p) => p.category_id === categoryId);
  }, [products, categoryId]);

  const selected = products.find((p) => p.id === productId) ?? null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select
          value={categoryId}
          onValueChange={(value) => {
            onCategoryChange(value);
            // Reset product when category changes to prevent mismatches
            onProductChange("");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Producto</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
              disabled={loadingProducts}
            >
              <span className={cn("truncate", !selected && "text-muted-foreground")}>
                {loadingProducts
                  ? "Cargando..."
                  : selected
                    ? selected.name
                    : "Selecciona un producto"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
          >
            <Command
              filter={(value, search) => {
                // case-insensitive substring match
                return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
              }}
            >
              <CommandInput placeholder="Buscar producto..." />
              <CommandList>
                <CommandEmpty>No se encontraron productos.</CommandEmpty>
                <CommandGroup>
                  {filteredProducts.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.name}
                      onSelect={() => {
                        onProductChange(p.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          productId === p.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="flex-1 truncate">{p.name}</span>
                      {showStockHint && (
                        <span className="text-muted-foreground text-xs ml-2">
                          {Number(p.current_stock)} {p.unit}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function MovementForm({
  type,
  products,
  categories,
  loadingProducts,
  userId,
}: FormCommonProps & { type: "entrada" | "salida" }) {
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState<string>(ALL_CATEGORIES);
  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const selected = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Sesión no encontrada");
      const qty = Number(quantity);
      const { error } = await supabase.from("inventory_logs").insert({
        product_id: productId,
        user_id: userId,
        type,
        quantity: qty,
        notes: notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Movimiento registrado correctamente");
      queryClient.invalidateQueries({ queryKey: ["inventory_logs"] });
      queryClient.invalidateQueries({ queryKey: ["products_minimal"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductId("");
      setQuantity("");
      setNotes("");
    },
    onError: (err: Error) => toast.error(err.message ?? "Error al registrar"),
  });

  const qtyNum = Number(quantity);
  const valid = productId !== "" && quantity !== "" && qtyNum > 0;
  const insufficient =
    type === "salida" && selected && qtyNum > Number(selected.current_stock);

  const isEntrada = type === "entrada";

  return (
    <Card className="p-6">
      <form
        className="space-y-4 max-w-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid || insufficient) return;
          mutation.mutate();
        }}
      >
        <CategoryAndProductPicker
          products={products}
          categories={categories}
          loadingProducts={loadingProducts}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          productId={productId}
          onProductChange={setProductId}
        />

        <div className="space-y-2">
          <Label>Cantidad</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
            />
            <span className="text-sm text-muted-foreground min-w-12">
              {selected?.unit ?? ""}
            </span>
          </div>
          {insufficient && (
            <p className="text-xs text-destructive">
              Stock insuficiente. Disponible: {Number(selected!.current_stock)}{" "}
              {selected!.unit}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Notas (opcional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Proveedor, motivo, lote, etc."
            rows={3}
          />
        </div>

        <Button
          type="submit"
          disabled={!valid || !!insufficient || mutation.isPending}
          className="w-full sm:w-auto"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEntrada ? "Registrar Entrada" : "Registrar Salida"}
        </Button>
      </form>
    </Card>
  );
}

function ConteoForm({
  products,
  categories,
  loadingProducts,
  userId,
}: FormCommonProps) {
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState<string>(ALL_CATEGORIES);
  const [productId, setProductId] = useState<string>("");
  const [realStock, setRealStock] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const selected = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId],
  );

  const theoretical = selected ? Number(selected.current_stock) : 0;
  const realNum = Number(realStock);
  const discrepancy =
    realStock === "" || !selected ? 0 : Number((realNum - theoretical).toFixed(4));
  const hasDiscrepancy = discrepancy !== 0;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Sesión no encontrada");
      const { error } = await supabase.from("inventory_logs").insert({
        product_id: productId,
        user_id: userId,
        type: "conteo_manual",
        quantity: realNum,
        theoretical_stock: theoretical,
        discrepancy,
        notes: notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Movimiento registrado correctamente");
      queryClient.invalidateQueries({ queryKey: ["inventory_logs"] });
      queryClient.invalidateQueries({ queryKey: ["products_minimal"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductId("");
      setRealStock("");
      setNotes("");
    },
    onError: (err: Error) => toast.error(err.message ?? "Error al registrar"),
  });

  const valid =
    productId !== "" &&
    realStock !== "" &&
    realNum >= 0;

  return (
    <Card className="p-6">
      <form
        className="space-y-4 max-w-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          mutation.mutate();
        }}
      >
        <CategoryAndProductPicker
          products={products}
          categories={categories}
          loadingProducts={loadingProducts}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          productId={productId}
          onProductChange={setProductId}
          showStockHint={false}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Stock Teórico</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={selected ? theoretical : ""}
                disabled
                placeholder="—"
              />
              <span className="text-sm text-muted-foreground min-w-10">
                {selected?.unit ?? ""}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Stock Real / Físico</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={realStock}
                onChange={(e) => setRealStock(e.target.value)}
                placeholder="0.00"
              />
              <span className="text-sm text-muted-foreground min-w-10">
                {selected?.unit ?? ""}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Merma / Diferencia</Label>
            <Input
              value={
                selected && realStock !== ""
                  ? discrepancy > 0
                    ? `+${discrepancy}`
                    : `${discrepancy}`
                  : ""
              }
              disabled
              className={
                hasDiscrepancy
                  ? discrepancy < 0
                    ? "text-destructive font-medium"
                    : "text-[oklch(0.45_0.15_145)] font-medium"
                  : ""
              }
              placeholder="—"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            Notas <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              hasDiscrepancy
                ? "Explica el motivo de la diferencia (merma, rotura, error previo...)"
                : "Observaciones del conteo"
            }
            rows={3}
          />
        </div>

        <Button
          type="submit"
          disabled={!valid || mutation.isPending}
          className="w-full sm:w-auto"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Registrar Conteo
        </Button>
      </form>
    </Card>
  );
}
