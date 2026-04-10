import { MantineProvider } from './MantineProvider';
import '../styles/global.css';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <MantineProvider>
      {children}
    </MantineProvider>
  );
}
