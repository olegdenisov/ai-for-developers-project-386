import React from 'react';
import ReactDOM from 'react-dom/client';
import { ReatomProvider } from '@reatom/jsx';
import { router } from './app/router/routes';
import { AppProviders } from './app/providers';
import { HomePage } from './pages/home';
import { EventTypePage } from './pages/event-type';
import { BookingPage } from './pages/booking';
import './app/styles/global.css';

// Route component mapping
const routeComponents = {
  home: HomePage,
  eventType: EventTypePage,
  booking: BookingPage,
};

// App component that renders based on current route
function App() {
  const route = router.useRoute();
  
  if (!route) {
    return <div>404 - Page not found</div>;
  }

  const Component = routeComponents[route.name as keyof typeof routeComponents];
  
  if (!Component) {
    return <div>404 - Page not found</div>;
  }

  return <Component params={route.params} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReatomProvider>
      <AppProviders>
        <App />
      </AppProviders>
    </ReatomProvider>
  </React.StrictMode>
);
