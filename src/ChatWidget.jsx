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

  // Scroll + focus
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatContainerRef.current && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };
    scrollToBottom();
    const t = setTimeout(() => {
      scrollToBottom();
      if (inputRef.current && isMobile && mobileOpen) {
        inputRef.current.focus({ preventScroll: true });
      }
    }, 200);
    return () => clearTimeout(t);
  }, [messages, loading, isMobile, mobileOpen]);

  // Bloqueo de scroll fondo en móvil
  useEffect(() => {
    if (isMobile && mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, mobileOpen]);

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
    
      const reply =
        data.raw ||
        (Array.isArray(data) && data[0]?.response) ||
        data.response ||
        (typeof data === 'string' ? data : 'Gracias, tu mensaje ha sido recibido.');
    
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
    } catch (error) {
      console.error('Error al contactar al backend:', error);
      setMessages((msgs) => [
        ...msgs,
        {
          position: 'left',
          type: 'text',
          text: 'Hubo un error al contactar al agente. Intenta más tarde.',
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

    if (msg.thinking) {
      return (
        <div key={`thinking-${i}`} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 22, marginRight: 6 }}>🤖</div>
          <div style={{
            background: '#e0e7ef',
            color: '#444',
            borderRadius: 18,
            padding: '10px 18px',
            fontSize: 17,
            maxWidth: '72vw',
            boxShadow: '0 1px 6px rgba(34,34,34,0.04)',
            fontStyle: 'italic',
            opacity: 0.8,
            animation: 'fadeInUp 0.3s ease-out'
          }}>
            Nema está pensando<span className="thinking-dots"></span>
          </div>
        </div>
      );
    }

    return (
      <div
        key={i}
        style={{
          animation: 'fadeInUp 0.3s ease-out',
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          alignItems: 'flex-end',
          marginBottom: 8,
        }}
      >
        {isBot && <div style={{ fontSize: 22, marginRight: 6 }}>🤖</div>}
        <div style={{
          background: isUser ? '#444' : '#e0e7ef',
          color: isUser ? '#fff' : '#444',
          borderRadius: 18,
          padding: '10px 18px',
          fontSize: 17,
          maxWidth: '72vw',
          boxShadow: '0 1px 6px rgba(34,34,34,0.04)',
        }}>
          {msg.text}
        </div>
      </div>
    );
  };

  const messagesToShow = loading
    ? [...messages, { position: 'left', thinking: true }]
    : messages;

  if (isMobile && !mobileOpen) {
    return (
      <button
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 10002,
          background: '#232323', color: '#fff', borderRadius: 32, border: 'none',
          padding: '14px 22px', fontWeight: 700, fontSize: 17,
          boxShadow: '0 2px 14px rgba(34,34,34,0.14)', cursor: 'pointer'
        }}
        onClick={() => setMobileOpen(true)}
      >
        💬 Chatea con Nema
      </button>
    );
  }

  if (isMobile && mobileOpen) {
    return (
      <div className="mobile-chat-layout" style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh',
        background: 'var(--card-bg, #faf9f6)', zIndex: 10010,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        boxShadow: '0 2px 24px 0 rgba(34,34,34,0.13)'
      }}>
        <div style={{ background: '#232323', color: '#fff', padding: '13px 0 11px', textAlign: 'center', fontWeight: 800, fontSize: 19, letterSpacing: 1, position: 'relative', flexShrink: 0 }}>
          Nema
          <button onClick={() => setMobileOpen(false)} style={{ position: 'absolute', right: 12, top: 8, background: 'none', border: 'none', color: '#fff', fontSize: 26, fontWeight: 700, cursor: 'pointer' }}>&times;</button>
        </div>
        <div ref={chatContainerRef} style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 8px 8px 8px',
          maxHeight: 'calc(100dvh - 64px - 64px)',
          scrollBehavior: 'smooth'
        }}>
          {messagesToShow.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
        <form style={{
          position: 'sticky', bottom: 0, zIndex: 10020,
          background: 'var(--card-bg, #faf9f6)',
          padding: '10px 8px 12px 8px', borderTop: '1px solid #eee'
        }} onSubmit={e => { e.preventDefault(); sendMessage(input); }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <input
              ref={inputRef}
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{
                width: '100%', borderRadius: 24, border: '1.5px solid #e0e0e0',
                fontSize: 18, padding: '12px 90px 12px 18px', background: '#fafbfc',
                boxShadow: 'none', outline: 'none', transition: 'border 0.2s'
              }}
            />
            <button type="submit" style={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
              height: 38, minWidth: 70, fontWeight: 700, fontSize: 17,
              borderRadius: 20, background: '#232323', color: '#fff', border: 'none',
              cursor: loading ? 'wait' : 'pointer'
            }} disabled={loading}>
              Enviar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--card-bg, #faf9f6)', borderRadius: 18,
      boxShadow: '0 2px 24px 0 rgba(34,34,34,0.07)', width: '100%',
      minHeight: 320, height: 'auto', display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end', overflow: 'hidden',
      transition: 'min-height 1.2s cubic-bezier(.4,1.2,.5,1)'
    }}>
      <div ref={chatContainerRef} style={{
        flex: 1, overflowY: 'auto', padding: '24px 16px 12px 16px',
        background: 'var(--card-bg, #faf9f6)', scrollBehavior: 'smooth'
      }}>
        {messagesToShow.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>
      <form style={{
        display: 'flex', alignItems: 'center', padding: '10px 16px 14px 16px',
        background: 'var(--card-bg, #faf9f6)', borderTop: '1px solid #eee'
      }} onSubmit={e => { e.preventDefault(); sendMessage(input); }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            ref={inputRef}
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            style={{
              width: '100%', borderRadius: 24, border: '1.5px solid #e0e0e0',
              fontSize: 18, padding: '12px 90px 12px 18px', background: '#fafbfc',
              boxShadow: 'none', outline: 'none', transition: 'border 0.2s'
            }}
          />
          <button type="submit" style={{
            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
            height: 38, minWidth: 70, fontWeight: 700, fontSize: 17,
            borderRadius: 20, background: '#232323', color: '#fff', border: 'none',
            cursor: loading ? 'wait' : 'pointer'
          }} disabled={loading}>
            Enviar
          </button>
        </div>
      </form>

      {/* Animaciones globales */}
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes dots {
            0% { content: ''; }
            33% { content: '.'; }
            66% { content: '..'; }
            100% { content: '...'; }
          }

          .thinking-dots::after {
            content: '';
            display: inline-block;
            animation: dots 1.2s steps(3, end) infinite;
            font-weight: bold;
            margin-left: 4px;
          }
        `}
      </style>
    </div>
  );
}
