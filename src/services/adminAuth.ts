import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/components/auth/AuthProvider";

interface AdminResponse {
  success?: boolean;
  error?: string;
  userId?: string;
}

async function invoke(action: string, payload: Record<string, unknown>): Promise<AdminResponse> {
  const { data, error } = await supabase.functions.invoke<AdminResponse>("admin-auth", {
    body: { action, payload },
  });
  if (error) {
    // Try to extract function-returned error message
    const ctx = (error as { context?: { error?: string } }).context;
    throw new Error(ctx?.error ?? error.message ?? "Error en la operación");
  }
  if (data?.error) throw new Error(data.error);
  return data ?? {};
}

export function createUser(email: string, password: string, role: AppRole) {
  return invoke("createUser", { email, password, role });
}

export function deleteUser(userId: string) {
  return invoke("deleteUser", { userId });
}

export function updateUserPassword(userId: string, password: string) {
  return invoke("updateUserPassword", { userId, password });
}
