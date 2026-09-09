import { createBrowserRouter } from 'react-router';
import { Root } from './Root';
import { Landing } from './pages/Landing';
import { Markets } from './pages/Markets';
import { Platform } from './pages/Platform';
import { Security } from './pages/Security';
import { Docs } from './pages/Docs';
import { SignIn } from './pages/SignIn';
import { LaunchApp } from './pages/LaunchApp';
import { Dashboard } from './pages/Dashboard';
import { BuyTokens } from './pages/BuyTokens';
import { Portfolio } from './pages/Portfolio';
import { Presentation } from './pages/Presentation';
import { HomePage } from './components/HomePage';
import { AdminLayout } from './components/AdminLayout';
import { InvoiceGenerator } from './components/InvoiceGenerator';
import { InvoiceManagement } from './components/InvoiceManagement';
import { InvoicePaymentPage } from './components/InvoicePaymentPage';
import { Layout } from './components/layout';
import { Dashboard as IdoAdminDashboard } from './pages/dashboard(1)';
import { Controls } from './pages/controls';
import { Treasury } from './pages/treasury';
import { Logs } from './pages/logs';
import { ProtocolsVerification } from './pages/ProtocolsVerification';
import { ProtocolNetwork } from './pages/ProtocolNetwork';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: 'markets', Component: Markets },
      { path: 'platform', Component: Platform },
      { path: 'security', Component: Security },
      { path: 'docs', Component: Docs },
      { path: 'signin', Component: SignIn },
      { path: 'launch-app', Component: LaunchApp },
      { path: 'main', Component: Landing },
      { path: 'dashboard', Component: Dashboard },
      { path: 'buy', Component: BuyTokens },
      { path: 'portfolio', Component: Portfolio },
      { path: 'presentation', Component: Presentation },
      { path: 'protocolsverification', Component: ProtocolsVerification },
      { path: 'protocolnetwork', Component: ProtocolNetwork },
      { path: 'controls', Component: ProtocolNetwork },
    ],
  },
  {
    path: '/gateway',
    Component: HomePage,
  },
  {
    path: '/pay/:invoiceId',
    Component: InvoicePaymentPage,
  },
  {
    path: '/admin',
    Component: AdminLayout,
    children: [
      {
        index: true,
        Component: InvoiceGenerator,
      },
      {
        path: 'invoices',
        Component: InvoiceManagement,
      },
    ],
  },
  {
    path: '/ido-admin',
    Component: Layout,
    children: [
      { index: true, Component: IdoAdminDashboard },
      { path: 'controls', Component: Controls },
      { path: 'treasury', Component: Treasury },
      { path: 'logs', Component: Logs },
    ],
  },
]);
