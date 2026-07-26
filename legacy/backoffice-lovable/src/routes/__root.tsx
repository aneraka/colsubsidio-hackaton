import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { InventoryProvider } from "@/components/inventory/InventoryProvider";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "La Cocina — Gestión de Inventario" },
      { name: "description", content: "Panel de gestión de inventario para restaurantes." },
      { property: "og:title", content: "La Cocina — Gestión de Inventario" },
      { name: "twitter:title", content: "La Cocina — Gestión de Inventario" },
      { property: "og:description", content: "Panel de gestión de inventario para restaurantes." },
      { name: "twitter:description", content: "Panel de gestión de inventario para restaurantes." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d38a9bf9-9e56-42b5-a152-33f31ac20476/id-preview-d5b4390d--6cd59b5d-aff9-4bf7-bae4-75a34f1db1fa.lovable.app-1780185194672.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d38a9bf9-9e56-42b5-a152-33f31ac20476/id-preview-d5b4390d--6cd59b5d-aff9-4bf7-bae4-75a34f1db1fa.lovable.app-1780185194672.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InventoryProvider>
          <Outlet />
          <Toaster />
        </InventoryProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
