import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AdminLoginModal } from '@/components/admin/AdminLoginModal';
import { AdminDashboardPage } from '@/components/admin/AdminDashboardPage';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function AdminPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login, logout } = useAdminAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(!isAuthenticated);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setLoginModalOpen(!isAuthenticated);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    setIsExiting(true);
    // Aguardar animação de saída antes de fazer logout
    await new Promise(resolve => setTimeout(resolve, 800));
    logout();
    setIsExiting(false);
  };

  // Se autenticado, mostrar a página completa do dashboard com animação
  if (isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        {!isExiting ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: {
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1], // Custom easing para movimento suave
                staggerChildren: 0.1
              }
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: -20,
              transition: {
                duration: 0.4,
                ease: [0.7, 0, 0.84, 0]
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: 0.2, duration: 0.4 }
              }}
            >
              <AdminDashboardPage onLogout={handleLogout} />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="exiting"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 0.9,
              transition: { duration: 0.5 }
            }}
            className="fixed inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                transition: {
                  duration: 0.3,
                  ease: "easeOut"
                }
              }}
              className="text-center space-y-4"
            >
              <motion.div
                animate={{
                  rotate: 360,
                  transition: {
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear"
                  }
                }}
                className="w-16 h-16 mx-auto border-4 border-white/30 border-t-white rounded-full"
              />
              <p className="text-white text-lg font-medium">Encerrando sessão...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Se não autenticado, mostrar a tela de login com animação
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-center px-4 py-16"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1],
            staggerChildren: 0.1
          }
        }}
        className="max-w-xl text-center space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { delay: 0.1, duration: 0.5, ease: "easeOut" }
          }}
          className="flex items-center justify-center"
        >
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 border border-white/10 shadow-2xl"
          >
            <ShieldCheck className="h-8 w-8 text-white" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: 0.2, duration: 0.5 }
          }}
          className="space-y-3"
        >
          <p className="text-xs uppercase tracking-[0.5em] text-white/50">
            Painel Administrativo
          </p>
          <h1 className="text-3xl font-semibold">Área restrita</h1>
          <p className="text-white/70">
            Utilize as credenciais internas para acessar o painel completo de cursos, uploads e
            análises. Esta área é monitorada e destinada apenas a administradores autorizados.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: 0.3, duration: 0.5 }
          }}
          className="flex flex-wrap justify-center gap-3"
        >
          <Button variant="secondary" onClick={() => navigate('/')}>
            Voltar para o site
          </Button>
          <Button onClick={() => setLoginModalOpen(true)}>
            Fazer login
          </Button>
        </motion.div>
      </motion.div>

      <AdminLoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => {
          login();
        }}
      />
    </motion.div>
  );
}
