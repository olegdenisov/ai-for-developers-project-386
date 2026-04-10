import { Center, Loader } from '@mantine/core';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  return (
    <Center py="xl">
      <Loader size={size} />
    </Center>
  );
}
