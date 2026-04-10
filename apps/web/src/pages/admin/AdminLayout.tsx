import { Anchor, AppShell, Group, NavLink, Text } from '@mantine/core';
import { IconCalendar, IconClock, IconExternalLink } from '@tabler/icons-react';
import { reatomComponent } from '@reatom/react';
import { homeRoute } from '@pages/home';
import { adminBookingsRoute, adminEventTypesRoute } from './model/route';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout для раздела администратора
 * Содержит боковую панель с навигацией по разделам
 */
export const AdminLayout = reatomComponent(({ children }: AdminLayoutProps) => {
  const isBookingsActive = adminBookingsRoute.match();
  const isEventTypesActive = adminEventTypesRoute.match();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 200, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="xs" justify="space-between">
          <Group gap="xs">
            <IconCalendar size={28} color="#f97316" />
            <Text size="lg" fw={600}>
              Calendar
            </Text>
          </Group>
          <Anchor
            href={homeRoute.path()}
            size="sm"
            c="dimmed"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <IconExternalLink size={16} />
            Клиентская часть
          </Anchor>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <NavLink
          label="Бронирования"
          leftSection={<IconCalendar size={18} />}
          active={isBookingsActive}
          onClick={() => adminBookingsRoute.go()}
          styles={{
            root: { borderRadius: 8 },
          }}
        />
        <NavLink
          label="Типы событий"
          leftSection={<IconClock size={18} />}
          active={isEventTypesActive}
          onClick={() => adminEventTypesRoute.go()}
          styles={{
            root: { borderRadius: 8 },
          }}
        />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}, 'AdminLayout');
