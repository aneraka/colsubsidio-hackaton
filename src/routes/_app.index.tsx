import { useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, DollarSign, Loader2, Package, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { consumeDeniedFlag } from "@/lib/access";
import { useAuth } from "@/components/auth/AuthProvider";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Resumen — La Cocina" },
      { name: "description", content: "Resumen del inventario del restaurante." },
    ],
  }),
  component: ResumenPage,
});

interface DashboardProduct {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number | null;
  categories: { name: string } | null;
}

function CopIcon({ className }: { className?: string }) {
  return (
    <span className={`font-bold text-xs tracking-tighter flex items-center justify-center ${className}`}>COP</span>
  );
}

function ResumenPage() {
  const { role } = useAuth();
  const isOperario = role === "operario";

  useEffect(() => {
    if (consumeDeniedFlag()) {
      toast.error("Acceso denegado", {
        description: "No tienes permisos para acceder a esa sección.",
      });
    }
  }, []);

  const productsQuery = useQuery({
    queryKey: ["dashboard_products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, unit, current_stock, min_stock, cost_per_unit, categories(name)");
      if (error) throw error;
      return (data ?? []) as unknown as DashboardProduct[];
    },
  });

  const movementsTodayQuery = useQuery({
    queryKey: ["dashboard_movements_today"],
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count, error } = await supabase
        .from("inventory_logs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfDay.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
  });

  const products = productsQuery.data ?? [];
  const loading = productsQuery.isLoading;

  const totalArticulos = products.length;

  const lowStock = useMemo(() => products.filter((p) => Number(p.current_stock) <= Number(p.min_stock)), [products]);

  const valorInventario = useMemo(
    () => products.reduce((sum, p) => sum + Number(p.current_stock) * Number(p.cost_per_unit ?? 0), 0),
    [products],
  );

  const stockPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const key = p.categories?.name ?? "Sin categoría";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  const alertasUrgentes = useMemo(() => {
    return [...lowStock]
      .map((p) => {
        const min = Number(p.min_stock) || 1;
        const ratio = Number(p.current_stock) / min;
        return { ...p, ratio };
      })
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 5);
  }, [lowStock]);

  const kpis = [
    {
      label: "Total Artículos",
      value: totalArticulos.toLocaleString("es-ES"),
      icon: Package,
      tint: "bg-primary/10 text-primary",
    },
    {
      label: "Stock Bajo",
      value: lowStock.length.toLocaleString("es-ES"),
      icon: AlertTriangle,
      tint: "bg-destructive/10 text-destructive",
      valueClass: lowStock.length > 0 ? "text-destructive" : "",
    },
    ...(isOperario
      ? []
      : [
          {
            label: "Valor del Inventario",
            value: valorInventario.toLocaleString("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 2,
            }),
            icon: CopIcon,
            tint: "bg-[oklch(0.62_0.15_145)/0.12] text-[oklch(0.45_0.15_145)]",
          },
        ]),
    {
      label: "Movimientos Hoy",
      value: (movementsTodayQuery.data ?? 0).toLocaleString("es-ES"),
      icon: TrendingUp,
      tint: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
    },
  ];


  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Resumen</h1>
        <p className="text-sm text-muted-foreground">Vista general del inventario y alertas activas.</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.tint}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-semibold tracking-tight ${"valueClass" in s ? (s.valueClass ?? "") : ""}`}>
                {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : s.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Stock por categoría */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Stock por categoría</CardTitle>
            <p className="text-sm text-muted-foreground">Cantidad de productos en cada categoría.</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : stockPorCategoria.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">Aún no hay productos para graficar.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockPorCategoria} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      cursor={{ fill: "oklch(0.6 0.05 250 / 0.08)" }}
                    />
                    <Bar dataKey="count" fill="oklch(0.55 0.18 250)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas urgentes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Alertas urgentes</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Top 5 productos con menor stock relativo.</p>
            </div>
            <Link
              to="/productos"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Ver
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : alertasUrgentes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No hay artículos con stock bajo. ¡Todo en orden!
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {alertasUrgentes.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.categories?.name ?? "Sin categoría"}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {Number(a.current_stock)} / {Number(a.min_stock)} {a.unit}
                      </span>
                      <Badge variant="destructive">Stock Bajo</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
