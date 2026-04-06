import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { HomePage, EventTypePage, BookingPage } from './pages';
import './app/styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/event-types/:id" element={<EventTypePage />} />
          <Route path="/bookings/new" element={<BookingPage />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  </React.StrictMode>
);
