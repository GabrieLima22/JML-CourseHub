import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminIconProps {
  className?: string;
}

export function AdminIcon({ className }: AdminIconProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/admin');
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 shadow-lg cursor-pointer",
        "transition-all duration-200 hover:shadow-xl hover:scale-[1.02] hover:shadow-violet-500/25",
        "active:scale-95",
        className
      )}
      title="Acesso Administrativo"
    >
      <GraduationCap className="h-7 w-7 text-white transition-transform group-hover:scale-110" />
    </div>
  );
}
