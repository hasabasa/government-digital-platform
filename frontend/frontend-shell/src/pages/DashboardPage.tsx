import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';

const DashboardPage: React.FC = () => {
  return (
    <MainLayout>
      {/* MainLayout уже содержит все необходимое: Sidebar + ChatArea */}
      {/* Дашборд как отдельная страница не нужен согласно документации */}
      {/* Основной интерфейс - это чат-приложение в стиле Telegram */}
    </MainLayout>
  );
};

export default DashboardPage;
