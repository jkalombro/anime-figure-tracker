import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { OverviewPage } from '../Overview/OverviewPage';
import { ActionFiguresPage } from '../Figures/ActionFiguresPage';
import { PreordersPage } from '../Preorders/PreordersPage';
import { EquipmentsPage } from '../Equipments/EquipmentsPage';
import { ShowcasePage } from '../Showcase/ShowcasePage';
import { SettingsPage } from '../Settings/SettingsPage';
import { LayoutDashboard, Library, Clock, Shield, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { MobileNavigation } from './components/MobileNavigation';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Close menu on location change
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [location]);

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Figures', path: '/dashboard/figures', icon: Library },
    { label: 'Preorders', path: '/dashboard/preorders', icon: Clock },
    { label: 'Equipment', path: '/dashboard/equipments', icon: Shield },
    { label: 'Showcase', path: '/dashboard/showcase', icon: User },
  ];

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col md:flex-row font-sans">
      <MobileNavigation
        user={user}
        logout={logout}
        navItems={navItems}
        isUserMenuOpen={isUserMenuOpen}
        setIsUserMenuOpen={setIsUserMenuOpen}
      />

      <Sidebar
        user={user}
        logout={logout}
        navItems={navItems}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-4 sm:p-8 mb-24 md:mb-0">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Routes location={location}>
                <Route index element={<OverviewPage />} />
                <Route path="figures" element={<ActionFiguresPage />} />
                <Route path="preorders" element={<PreordersPage />} />
                <Route path="equipments" element={<EquipmentsPage />} />
                <Route path="showcase" element={<ShowcasePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
