import { ReactNode, useEffect, useState } from "react";
import { getCurrentUser, logout } from "../services/auth";

export default function ProtectedRoute({ children, requireRole }: { children: ReactNode; requireRole?: string }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAllowed(false);
      return;
    }
    getCurrentUser()
      .then((user) => {
        if (requireRole && user.role !== requireRole) {
          setAllowed(false);
        } else {
          setAllowed(true);
        }
      })
      .catch(() => {
        setAllowed(false);
      });
  }, [requireRole]);

  if (allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">Wird geprüft…</div>
    );
  }

  if (!allowed) {
    logout();
    return null;
  }

  return <>{children}</>;
}


