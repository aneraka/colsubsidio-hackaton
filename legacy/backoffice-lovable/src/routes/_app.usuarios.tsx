import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, KeyRound, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { flagDenied } from "@/lib/access";
import { useAuth, type AppRole } from "@/components/auth/AuthProvider";
import { createUser, deleteUser, updateUserPassword } from "@/services/adminAuth";

interface ProfileRow {
  id: string;
  email: string;
  role: AppRole;
  created_at: string | null;
}

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "operario", label: "Operario" },
];

const ROLE_BADGE: Record<AppRole, { label: string; className: string }> = {
  super_admin: {
    label: "Super Admin",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  admin: {
    label: "Admin",
    className: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
  },
  operario: {
    label: "Operario",
    className: "bg-muted text-muted-foreground border-border",
  },
};

function displayEmail(email: string) {
  return email.endsWith("@lacocina.com") ? email.split("@")[0] : email;
}

export const Route = createFileRoute("/_app/usuarios")({
  head: () => ({
    meta: [
      { title: "Gestión de Usuarios — La Cocina" },
      { name: "description", content: "Administración de usuarios y roles." },
    ],
  }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const { user: currentUser, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role !== null && role !== "super_admin") {
      flagDenied();
      navigate({ to: "/" });
    }
  }, [loading, role, navigate]);

  if (loading || role === null || role !== "super_admin") {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [pwdTarget, setPwdTarget] = useState<ProfileRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProfileRow | null>(null);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, role, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AppRole }) => {
      const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rol actualizado");
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Error al actualizar el rol"),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      toast.success("Usuario eliminado");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message ?? "Error al eliminar"),
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Administra los usuarios del sistema y sus roles.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead className="w-[200px]">Rol</TableHead>
              <TableHead className="w-[260px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : !profiles?.length ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                  No hay usuarios.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((p) => {
                const isSelf = p.id === currentUser?.id;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {displayEmail(p.email)}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">(tú)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={p.role}
                        disabled={isSelf || updateRoleMutation.isPending}
                        onValueChange={(value) =>
                          updateRoleMutation.mutate({ id: p.id, role: value as AppRole })
                        }
                      >
                        <SelectTrigger className="h-8 w-[160px]">
                          <SelectValue>
                            <Badge
                              variant="outline"
                              className={ROLE_BADGE[p.role].className}
                            >
                              {ROLE_BADGE[p.role].label}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPwdTarget(p)}
                        >
                          <KeyRound className="h-4 w-4 mr-1.5" />
                          Contraseña
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isSelf}
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

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => qc.invalidateQueries({ queryKey: ["profiles"] })}
      />

      <ChangePasswordDialog
        target={pwdTarget}
        onClose={() => setPwdTarget(null)}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta de{" "}
              <strong>{deleteTarget?.email}</strong>.
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
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const normalizeUsername = (raw: string) =>
    raw.trim().toLowerCase().replace(/\s+/g, "");

  const mutation = useMutation({
    mutationFn: () => {
      const normalized = normalizeUsername(username);
      const dummyEmail = `${normalized}@lacocina.com`;
      return createUser(dummyEmail, password, "operario");
    },
    onSuccess: () => {
      toast.success("Usuario creado");
      onCreated();
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message ?? "Error al crear usuario"),
  });

  const reset = () => {
    setUsername("");
    setPassword("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Crea una cuenta de operario. El usuario podrá iniciar sesión con su nombre de usuario y contraseña.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const normalized = normalizeUsername(username);
            if (!normalized || password.length < 6) {
              toast.error("Nombre de usuario válido y contraseña de al menos 6 caracteres.");
              return;
            }
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="new-username">Nombre de usuario</Label>
            <Input
              id="new-username"
              autoComplete="off"
              placeholder="ej. juan o carlos_cocina"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Contraseña</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            El usuario se creará con el rol de Operario por defecto.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <UserCog className="h-4 w-4 mr-2" />
              Crear usuario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordDialog({
  target,
  onClose,
}: {
  target: ProfileRow | null;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      if (!target) throw new Error("Sin usuario");
      return updateUserPassword(target.id, password);
    },
    onSuccess: () => {
      toast.success("Contraseña actualizada");
      setPassword("");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message ?? "Error al cambiar la contraseña"),
  });

  return (
    <Dialog
      open={!!target}
      onOpenChange={(o) => {
        if (!o) {
          setPassword("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Define una nueva contraseña para <strong>{target?.email}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password.length < 6) {
              toast.error("La contraseña debe tener al menos 6 caracteres.");
              return;
            }
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="reset-pwd">Nueva contraseña</Label>
            <Input
              id="reset-pwd"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Actualizar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
