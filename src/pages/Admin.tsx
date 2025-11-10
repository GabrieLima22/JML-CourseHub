import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminLoginModal } from '@/components/admin/AdminLoginModal';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function AdminPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login, logout } = useAdminAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(!isAuthenticated);
  const [dashboardOpen, setDashboardOpen] = useState(isAuthenticated);

  useEffect(() => {
    setLoginModalOpen(!isAuthenticated);
    setDashboardOpen(isAuthenticated);
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-xl text-center space-y-6">
        <div className="flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 border border-white/10 shadow-2xl">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.5em] text-white/50">
            Painel Administrativo
          </p>
          <h1 className="text-3xl font-semibold">Área restrita</h1>
          <p className="text-white/70">
            Utilize as credenciais internas para acessar o painel completo de cursos, uploads e
            análises. Esta área é monitorada e destinada apenas a administradores autorizados.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/')}>
            Voltar para o site
          </Button>
          {isAuthenticated ? (
            <Button variant="outline" onClick={() => logout()}>
              Encerrar sessão
            </Button>
          ) : (
            <Button onClick={() => setLoginModalOpen(true)}>
              Fazer login
            </Button>
          )}
        </div>

        {isAuthenticated && (
          <p className="text-xs text-white/60">
            Sessão ativa. Feche o painel para continuar navegando ou encerre para trocar de usuário.
          </p>
        )}
      </div>

      <AdminLoginModal
        open={loginModalOpen && !isAuthenticated}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => {
          login();
          setDashboardOpen(true);
        }}
      />

      <AdminDashboard
        open={dashboardOpen && isAuthenticated}
        onClose={() => setDashboardOpen(false)}
      />
    </div>
  );
}
