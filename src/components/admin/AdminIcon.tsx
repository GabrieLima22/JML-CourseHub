import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { AdminLoginModal } from "@/components/admin/AdminLoginModal";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { cn } from "@/lib/utils";

interface AdminIconProps {
  className?: string;
}

export function AdminIcon({ className }: AdminIconProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const { isAuthenticated, login } = useAdminAuth();

  const handleClick = () => {
    if (isAuthenticated) {
      setShowDashboard(true);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginSuccess = () => {
    login();
    setShowLoginModal(false);
    setShowDashboard(true);
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={cn(
          "group flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-aurora shadow-sm cursor-pointer",
          "transition-all duration-200 hover:shadow-lg hover:scale-105 hover:shadow-primary/25",
          "active:scale-95",
          className
        )}
        title={isAuthenticated ? "Abrir Painel Admin" : "Acesso Administrativo"}
      >
        <GraduationCap className="h-7 w-7 text-white transition-transform group-hover:scale-110" />
      </div>

      <AdminLoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />

      <AdminDashboard
        open={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </>
  );
}
