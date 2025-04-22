import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const getUserId = () => {
  let id = localStorage.getItem('nemawashi_user_id');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('nemawashi_user_id', id);
  }
  return id;
};

export default function ChatWidget() {
  const [messages, setMessages] = useState([
    {
      position: 'left',
      type: 'text',
      text: '¡Hola! Soy Nema, tu agente IA. Cuéntame qué tarea repetitiva te quita tiempo y te ayudo a automatizarla.',
      date: new Date(),
      title: 'Nema',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const userId = getUserId();
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Scroll to the last message, pero espera a que el DOM se actualice
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50); // Espera breve para asegurar render
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setMessages((msgs) => [
      ...msgs,
      {
        position: 'right',
        type: 'text',
        text,
        date: new Date(),
        title: 'Tú',
      },
    ]);
    setLoading(true);
    setInput('');
    try {
      const res = await fetch('/api/chat-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, userId }),
      });
      const data = await res.json();
      // Soporta respuesta como array o string
      let reply = '';
      if (data.raw) {
        reply = data.raw;
      } else if (Array.isArray(data) && data[0]?.response) {
        reply = data[0].response;
      } else if (typeof data === 'object' && data.response) {
        reply = data.response;
      } else if (typeof data === 'string') {
        reply = data;
      } else {
        reply = 'Gracias, tu mensaje ha sido recibido.';
      }
      setMessages((msgs) => [
        ...msgs,
        {
          position: 'left',
          type: 'text',
          text: reply,
          date: new Date(),
          title: 'Nema',
        },
      ]);
    } catch (e) {
      setMessages((msgs) => [
        ...msgs,
        {
          position: 'left',
          type: 'text',
          text: 'Hubo un error al conectar con el agente. Intenta de nuevo más tarde.',
          date: new Date(),
          title: 'Nema',
        },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const renderMessage = (msg, i) => {
    const isBot = msg.position === 'left';
    const isUser = msg.position === 'right';
    return (
      <div
        key={i}
        style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          alignItems: 'flex-end',
          marginBottom: 10,
        }}
      >
        {isBot && (
          <span style={{ fontSize: 22, marginRight: 6, userSelect: 'none' }} role="img" aria-label="Nema">🤖</span>
        )}
        <div
          style={{
            background: isBot ? 'var(--bubble-bot, #e7eafc)' : 'var(--bubble-user, #232323)',
            color: isBot ? '#222' : '#fff',
            borderRadius: 18,
            border: 'none',
            padding: '12px 18px',
            fontSize: 18,
            maxWidth: '80%',
            fontFamily: 'Inter, Arial, sans-serif',
            boxShadow: '0 2px 8px 0 rgba(34,34,34,0.04)',
            wordBreak: 'break-word',
            lineHeight: 1.6,
          }}
        >
          {msg.text}
        </div>
      </div>
    );
  };

  if (isMobile && !mobileOpen) {
    // Botón flotante para abrir chat en móvil
    return (
      <button
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 10002,
          background: '#232323', color: '#fff', borderRadius: 32, border: 'none',
          padding: '14px 22px', fontWeight: 700, fontSize: 17, boxShadow: '0 2px 14px rgba(34,34,34,0.14)', cursor: 'pointer'
        }}
        onClick={() => setMobileOpen(true)}
      >
        💬 Chatea con Nema
      </button>
    );
  }
  if (isMobile && mobileOpen) {
    // Layout móvil pantalla completa
    return (
      <div className="mobile-chat-layout" style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--card-bg, #faf9f6)', zIndex: 10010, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxShadow: '0 2px 24px 0 rgba(34,34,34,0.13)'
      }}>
        {/* Cabecera */}
        <div style={{ background: '#232323', color: '#fff', padding: '13px 0 11px 0', textAlign: 'center', fontWeight: 800, fontSize: 19, letterSpacing: 1, position: 'relative' }}>
          Nema
          <button onClick={() => setMobileOpen(false)} style={{ position: 'absolute', right: 12, top: 8, background: 'none', border: 'none', color: '#fff', fontSize: 26, fontWeight: 700, cursor: 'pointer' }}>&times;</button>
        </div>
        {/* Mensajes */}
        <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 8px 8px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
        {/* Input */}
        <form style={{ display: 'flex', alignItems: 'center', padding: '10px 8px 12px 8px', background: 'var(--card-bg, #faf9f6)', borderTop: '1px solid #eee', width: '100%', boxSizing: 'border-box' }} onSubmit={e => { e.preventDefault(); sendMessage(input); }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <input
              ref={inputRef}
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{ width: '100%', borderRadius: 24, border: '1.5px solid #e0e0e0', fontSize: 18, padding: '12px 90px 12px 18px', background: '#fafbfc', boxShadow: 'none', outline: 'none', transition: 'border 0.2s', minWidth: 0 }}
            />
            <button type="submit" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', height: 38, minWidth: 70, maxWidth: 100, fontWeight: 700, fontSize: 17, borderRadius: 20, background: 'var(--primary, #232323)', color: '#fff', border: 'none', boxShadow: '0 2px 8px 0 rgba(34,34,34,0.04)', cursor: loading ? 'wait' : 'pointer', transition: 'background 0.2s', overflow: 'hidden', whiteSpace: 'nowrap' }} disabled={loading}>
              Enviar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--card-bg, #faf9f6)',
      borderRadius: 18,
      boxShadow: '0 4px 24px 0 rgba(34,34,34,0.07)',
      padding: 0,
      maxWidth: '100%',
      width: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 340,
      border: '1.5px solid #f0f0f0',
      overflow: 'hidden',
      fontFamily: 'Inter, Arial, sans-serif',
    }}>
      <div ref={chatContainerRef} style={{
        flex: 1,
        minHeight: 180,
        maxHeight: 320,
        maxWidth: '100%',
        overflowY: 'auto',
        padding: '18px 8px 8px 8px',
        background: 'var(--card-bg, #faf9f6)',
        borderBottom: '1px solid #eee',
        transition: 'background 0.2s',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}>
        {/* Custom message bubbles */}
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>
      <form
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 8px 12px 8px',
          background: 'var(--card-bg, #faf9f6)',
          borderTop: '1px solid #eee',
          width: '100%',
          boxSizing: 'border-box',
        }}
        onSubmit={e => { e.preventDefault(); sendMessage(input); }}
      >
        <div style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
        }}>
          <input
            ref={inputRef}
            placeholder="Escribe tu mensaje..."
            multiline={false}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            style={{
              width: '100%',
              borderRadius: 24,
              border: '1.5px solid #e0e0e0',
              fontSize: 18,
              padding: '12px 90px 12px 18px',
              background: '#fafbfc',
              boxShadow: 'none',
              outline: 'none',
              transition: 'border 0.2s',
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            style={{
              position: 'absolute',
              right: 6,
              top: '50%',
              transform: 'translateY(-50%)',
              height: 38,
              minWidth: 70,
              maxWidth: 100,
              fontWeight: 700,
              fontSize: 17,
              borderRadius: 20,
              background: 'var(--primary, #232323)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 2px 8px 0 rgba(34,34,34,0.04)',
              cursor: loading ? 'wait' : 'pointer',
              transition: 'background 0.2s',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              padding: '0 18px',
            }}
          >
            {loading ? '...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
