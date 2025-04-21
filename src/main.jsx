import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from './ChatWidget';

const el = document.getElementById('sima-chat-widget');
if (el) {
  createRoot(el).render(<ChatWidget />);
}
