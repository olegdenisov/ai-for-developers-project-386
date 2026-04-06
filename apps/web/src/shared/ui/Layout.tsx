import { AppShell, Container, Text } from '@mantine/core';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <AppShell padding="md">
      <AppShell.Main>
        <Container size="md" py="xl">
          {title && (
            <Text component="h1" size="xl" fw={600} mb="xl">
              {title}
            </Text>
          )}
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
