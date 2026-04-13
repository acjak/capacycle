import { useAuth } from "./AuthContext.jsx";

export function useUnit() {
  const { auth } = useAuth();
  const unit = (auth && typeof auth === "object" && auth.settings?.unit) || "hours";
  return unit === "points" ? "p" : "h";
}
