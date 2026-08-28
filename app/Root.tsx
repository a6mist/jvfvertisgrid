import { Outlet } from 'react-router';
import { JVFNav } from './components/JVFNav';
import { Toaster } from 'sonner';
import { colors } from './config/design-tokens';

export const Root = () => {
  return (
    <div style={{ background: colors.bg, color: colors.text, minHeight: '100vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <JVFNav />
      <main>
        <Outlet />
      </main>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: colors.surface,
            color: colors.text,
            border: `1px solid ${colors.teal}`,
          },
        }}
      />
    </div>
  );
};
