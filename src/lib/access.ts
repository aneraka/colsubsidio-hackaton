import type { AppRole } from "@/components/auth/AuthProvider";

export const DENIED_FLAG = "lacocina:access_denied";

export function flagDenied() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(DENIED_FLAG, "1");
  }
}

export function consumeDeniedFlag(): boolean {
  if (typeof window === "undefined") return false;
  const v = sessionStorage.getItem(DENIED_FLAG);
  if (v) {
    sessionStorage.removeItem(DENIED_FLAG);
    return true;
  }
  return false;
}

export function roleAllowed(role: AppRole | null, allowed: AppRole[]): boolean {
  return role !== null && allowed.includes(role);
}
