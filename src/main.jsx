import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from './ChatWidget';
import CasoUsoPedidosCitas from './CasoUsoPedidosCitas';

function App() {
  const [page, setPage] = useState('main');

  if (page === 'caso-uso') {
    return <CasoUsoPedidosCitas onBack={() => setPage('main')} />;
  }

  return (
    <div>

      <div style={{ marginTop: 12 }}>
        <ChatWidget />
      </div>
    </div>
  );
}

const el = document.getElementById('sima-chat-widget');
if (el) {
  createRoot(el).render(<App />);
}
