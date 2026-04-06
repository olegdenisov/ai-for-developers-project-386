import { MantineProvider as MantineLibProvider, ColorSchemeScript } from '@mantine/core';
import { mantineTheme } from '../styles/mantine.theme';

interface MantineProviderProps {
  children: React.ReactNode;
}

export function MantineProvider({ children }: MantineProviderProps) {
  return (
    <>
      <ColorSchemeScript defaultColorScheme="auto" />
      <MantineLibProvider theme={mantineTheme} defaultColorScheme="auto">
        {children}
      </MantineLibProvider>
    </>
  );
}
