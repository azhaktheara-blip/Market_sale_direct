import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { CartDrawer } from '../cart/CartDrawer';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 selection:bg-forest-100 pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <CartDrawer />
    </div>
  );
};

