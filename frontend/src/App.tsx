import { reatomComponent } from '@reatom/react';
import { MantineProvider, Container } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { layoutRoute } from './shared/routing';

export const App = reatomComponent(() => {
  return (
    <MantineProvider>
      <Notifications />
      <Container size="lg" py="xl">
        {layoutRoute.render()}
      </Container>
    </MantineProvider>
  );
}, 'App');