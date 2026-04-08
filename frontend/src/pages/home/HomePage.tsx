import { Container, Title, Text, Button } from '@mantine/core';
import { reatomComponent } from '@reatom/react';
import { guestRoute, ownerRoute } from '../../shared/routing';

export const HomePage = reatomComponent(() => {
  const handleGuestClick = () => {
    guestRoute.go();
  };

  const handleOwnerClick = () => {
    ownerRoute.go();
  };

  return (
    <Container size="lg" py="xl">
      <Title order={1} ta="center" mb="md">
        Calendar Call Booking
      </Title>
      <Text ta="center" c="dimmed" mb="xl">
        Учебный проект Hexlet: система бронирования звонков в календаре
      </Text>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Button onClick={handleGuestClick} size="lg">
          Я гость
        </Button>
        <Button onClick={handleOwnerClick} variant="outline" size="lg">
          Я владелец
        </Button>
      </div>
    </Container>
  );
}, 'HomePage');