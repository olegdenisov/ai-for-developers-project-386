import { AppShell, Container, Group, Text, Button, Box } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { navigate } from '@app/router';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            {/* Логотип */}
            <Group gap="xs">
              <IconCalendar size={28} color="#f97316" />
              <Text size="lg" fw={600}>
                Calendar
              </Text>
            </Group>

            {/* Навигация */}
            <Group gap="lg">
              <Button 
                variant="subtle" 
                color="gray" 
                onClick={() => navigate.booking()}
                styles={{
                  root: {
                    color: '#6b7280',
                  },
                }}
              >
                Записаться
              </Button>
              <Button 
                variant="subtle" 
                color="gray"
                styles={{
                  root: {
                    color: '#6b7280',
                  },
                }}
              >
                Админка
              </Button>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Box h="calc(100vh - 60px)">
          {title && (
            <Container size="xl" py="xl">
              <Text component="h1" size="xl" fw={600} mb="xl">
                {title}
              </Text>
            </Container>
          )}
          {children}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
