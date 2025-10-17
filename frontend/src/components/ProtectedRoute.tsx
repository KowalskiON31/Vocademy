import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/auth";

interface Props {
  children: ReactNode;
  requireRole?: string;
}

export default function ProtectedRoute({ children, requireRole }: Props) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAllowed(false);
      return;
    }

    getCurrentUser()
      .then((user) => {
        const userRole = String(user?.role || "").toLowerCase();
        const needRole = requireRole ? String(requireRole).toLowerCase() : undefined;
        if (needRole && userRole !== needRole) {
          setAllowed(false);
        } else {
          setAllowed(true);
        }
      })
      .catch(() => setAllowed(false));
  }, []);

  if (allowed === null) return <div className="text-center mt-20">Lade...</div>;
  if (!allowed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
