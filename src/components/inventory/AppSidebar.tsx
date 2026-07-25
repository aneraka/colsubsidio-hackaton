import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Package, ChefHat, Boxes, Users, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth, type AppRole } from "@/components/auth/AuthProvider";

type NavItem = {
  title: string;
  url: "/" | "/inventario" | "/productos" | "/usuarios";
  icon: typeof LayoutDashboard;
  roles: AppRole[];
};

const items: NavItem[] = [
  {
    title: "Resumen",
    url: "/",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "operario"],
  },
  {
    title: "Operaciones de Inventario",
    url: "/inventario",
    icon: Package,
    roles: ["super_admin", "admin", "operario"],
  },
  {
    title: "Catálogo de Productos",
    url: "/productos",
    icon: Boxes,
    roles: ["super_admin", "admin"],
  },
  {
    title: "Gestión de Usuarios",
    url: "/usuarios",
    icon: Users,
    roles: ["super_admin"],
  },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { role, user, signOut } = useAuth();
  const navigate = useNavigate();

  const visible = items.filter((item) => (role ? item.roles.includes(role) : false));

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const roleLabel: Record<AppRole, string> = {
    super_admin: "Super Admin",
    admin: "Administrador",
    operario: "Operario",
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ChefHat className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold leading-tight">La Cocina</span>
            <span className="text-xs text-muted-foreground leading-tight">
              Gestión de inventario
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="flex flex-col gap-2 px-2 py-2 group-data-[collapsible=icon]:hidden">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{user?.email ?? "—"}</span>
            <span className="text-xs text-muted-foreground">
              {role ? roleLabel[role] : "Sin rol"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex justify-center py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
