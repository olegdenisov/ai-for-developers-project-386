import { PublicApi } from '@calendar-booking/api-client';
import { ENV } from '@shared/config';

// Создаем единый инстанс API клиента
// В режиме mock использует VITE_API_URL=http://localhost:3100 (Prism)
export const apiClient = new PublicApi(ENV.API_URL);
