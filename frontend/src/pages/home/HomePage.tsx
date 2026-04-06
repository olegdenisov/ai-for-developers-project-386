import { Container, Title, Text, Button } from '@mantine/core';

export function HomePage() {
  return (
    <Container size="lg" py="xl">
      <Title order={1} ta="center" mb="md">
        Calendar Call Booking
      </Title>
      <Text ta="center" c="dimmed" mb="xl">
        Учебный проект Hexlet: система бронирования звонков в календаре
      </Text>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Button component="a" href="/guest" size="lg">
          Я гость
        </Button>
        <Button component="a" href="/owner" variant="outline" size="lg">
          Я владелец
        </Button>
      </div>
    </Container>
  );
}