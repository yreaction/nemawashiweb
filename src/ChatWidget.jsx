import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/chat-markdown-table.css';
import '../styles/welcome-glow.css';

const getUserId = () => {
  let id = localStorage.getItem('nemawashi_user_id');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('nemawashi_user_id', id);
  }
  return id;
};

// Casos de ejemplo para el mensaje de bienvenida (markdown puro, sin HTML inline)
const welcomeCases = [
  `🦷 **Clínica Dental**\n\n👉 Un agente por WhatsApp podría recordar citas a los pacientes, confirmar cambios y enviar recordatorios automáticos de revisiones.`,

  `🧘‍♀️ **Centro de Fisioterapia**\n\n👉 Un asistente de IA podría gestionar toda la agenda, coordinar cambios de citas y avisar a los pacientes si hay huecos libres.`,

  `🏡 **Agencia Inmobiliaria**\n\n👉 Un agente podría captar interesados automáticamente, enviarles información personalizada de propiedades y coordinar visitas sin intervención humana.`,

  `💼 **Consultora o Asesoría**\n\n👉 Un agente podría pedir a los clientes la documentación fiscal que falta, verificarla y avisar automáticamente de plazos importantes.`,

  `🛒 **Tienda Online (Ecommerce)**\n\n👉 Un bot de WhatsApp o email podría informar del estado de cada pedido, resolver dudas frecuentes y gestionar cambios de entrega.`,

  `🏥 **Clínica Estética o de Salud**\n\n👉 Un asistente podría enviar encuestas de satisfacción tras cada sesión y ofrecer promociones personalizadas según el historial del cliente.`,

  `🎓 **Academias y Formación**\n\n👉 Un agente podría gestionar inscripciones automáticamente, enviar recordatorios de clases y materiales de estudio.`,

  `📸 **Fotógrafos y Creativos**\n\n👉 Un asistente podría entregar galerías online personalizadas, gestionar pedidos de impresión y recordar vencimientos de sesiones.`,

  `🍽️ **Restaurantes y Catering**\n\n👉 Un agente podría enviar promociones personalizadas a clientes habituales y gestionar reservas automáticamente.`,

  `🧑‍⚖️ **Abogados y Despachos Jurídicos**\n\n👉 Un asistente podría enviar actualizaciones de casos a los clientes y pedir documentación de forma segura, sin saturar el correo.`,

];


// Helper para bienvenida: devuelve el string tal cual
function getSingleRowWelcomeCase(markdown) {
  return markdown;
}

function getRandomWelcomeCase() {
  const raw = welcomeCases[Math.floor(Math.random() * welcomeCases.length)];
  return getSingleRowWelcomeCase(raw);
}

function flattenCellContent(content) {
  if (content == null) return '';
  if (typeof content === 'string' || typeof content === 'number') return content;
  if (Array.isArray(content)) return content.map(flattenCellContent).join('');
  if (typeof content === 'object' && content.props && content.props.children)
    return flattenCellContent(content.props.children);
  return '';
}

function MarkdownTable({node, ...props}) {
  // Header cells (th)
  const headerRow = props.children[0];
  const headerCells = headerRow && headerRow.props && headerRow.props.children
    ? React.Children.toArray(headerRow.props.children).filter(Boolean)
    : [];
  // Body rows (tr)
  const bodyRows = props.children.slice(1).filter(Boolean);

  return (
    <table className="chat-markdown-table">
      <thead>
        <tr>
          {headerCells.map((th, i) => (
            <th key={i} style={{minWidth: i === 1 ? 18 : 120, padding: '7px 18px', textAlign: i === 1 ? 'center' : 'left'}}>{flattenCellContent(th.props.children)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {bodyRows.map((row, i) => {
          if (!row || !row.props || !row.props.children) return null;
          const cells = React.Children.toArray(row.props.children).filter(Boolean);
          return (
            <tr key={i}>
              {cells.map((cell, j) => {
                let cellContent = flattenCellContent(cell.props.children);
                // Si es la columna vacía, deja el td vacío
                if (j === 1) {
                  return <td key={j} style={{minWidth: 18, padding: '7px 18px'}}></td>;
                }
                return (
                  <td key={j} className={j === 0 ? 'tick' : j === 2 ? 'benefit' : ''} style={{padding: '7px 18px'}}>
                    {j === 0 ? <span className="tick">✔</span> : null}
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function ChatWidget() {
  const [messages, setMessages] = useState([
    {
      position: 'left',
      type: 'text',
      markdown: true,
      text:
        `👋 ¡Hola, soy **Nema**!\n\n` +
        `Dime a qué te dedicas, y te enseñaré cómo puedes ahorrar tiempo cada semana automatizando tareas, **sin que necesites conocimientos técnicos**.\n\n` +
        getRandomWelcomeCase() + '\n\n---',
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
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    // Detectar si es mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 600);
      setWindowHeight(window.innerHeight);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const messagesToShow = loading ? [...messages, { position: 'left', thinking: true }] : messages;

  // Efecto para scroll automático
  useEffect(() => {
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages, loading]);

  // Efecto para manejar el scroll cuando se abre en mobile
  useEffect(() => {
    if (isMobile && mobileOpen) {
      setTimeout(() => {
        scrollToBottom();
        inputRef.current?.focus({ preventScroll: true });
      }, 250);
    }
  }, [isMobile, mobileOpen]);

  // Control del overflow del body
  useEffect(() => {
    if (isMobile && mobileOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.position = 'fixed';
      document.documentElement.style.width = '100%';
      document.documentElement.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.position = '';
      document.documentElement.style.width = '';
      document.documentElement.style.height = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.position = '';
      document.documentElement.style.width = '';
      document.documentElement.style.height = '';
    };
  }, [isMobile, mobileOpen]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end'
      });
    }
  };

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
    
    setTimeout(scrollToBottom, 50);
    
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
      
      setTimeout(scrollToBottom, 50);
    } catch {
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
        <div key={`thinking-${i}`} style={{ 
          display: 'flex', 
          justifyContent: 'flex-start', 
          alignItems: 'center', 
          marginBottom: 12 
        }}>
          <div style={{ fontSize: 22, marginRight: 6 }}>🌱</div>
          <div style={{
            background: '#e0e0e0',
            color: '#444',
            borderRadius: 18,
            padding: '10px 18px',
            fontSize: 17,
            maxWidth: isMobile ? '72vw' : '500px',
            boxShadow: '0 1px 6px rgba(34,34,34,0.04)',
            fontStyle: 'italic',
            opacity: 0.8,
            animation: 'fadeInUp 0.3s ease-out',
            fontFamily: 'Manifold',
            fontWeight: 300
          }}>
            Nema está pensando<span className="thinking-dots"></span>
          </div>
        </div>
      );
    }
    // Mensaje de bienvenida: glow arriba, markdown abajo
    if (i === 0 && msg.markdown) {
      return (
        <div key={i} style={{
          animation: 'fadeInUp 0.3s ease-out',
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: 16,
        }}>
          {isBot && <div style={{ fontSize: 22, marginRight: 6 }}>🌱</div>}
          <div style={{
            background: isUser ? '#444' : '#e0e7ef',
            color: isUser ? '#fff' : '#444',
            borderRadius: 18,
            padding: '10px 18px',
            fontSize: 17,
            maxWidth: isMobile ? '72vw' : '500px',
            boxShadow: '0 1px 6px rgba(34,34,34,0.04)',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            fontFamily: 'Manifold',
            fontWeight: isBot ? 400 : 500
          }}>
            <div style={{marginBottom: 12, textAlign: 'center'}}>
              <span className="welcome-glow">Dime a qué te dedicas</span>
            </div>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{table: MarkdownTable}}>
              {msg.text.replace('Dime a qué te dedicas, y te enseñaré cómo puedes ahorrar tiempo cada semana automatizando tareas.', '')}
            </ReactMarkdown>
          </div>
        </div>
      );
    }
    return (
      <div key={i} style={{
        animation: 'fadeInUp 0.3s ease-out',
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
      }}>
        {isBot && <div style={{ fontSize: 22, marginRight: 6 }}>🌱</div>}
        <div style={{
          background: isUser ? '#444' : '#e0e7ef',
          color: isUser ? '#fff' : '#444',
          borderRadius: 18,
          padding: '10px 18px',
          fontSize: 17,
          maxWidth: isMobile ? '72vw' : '500px',
          boxShadow: '0 1px 6px rgba(34,34,34,0.04)',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
          fontFamily: 'Manifold',
          fontWeight: isBot ? 400 : 500
        }}>
          {msg.markdown ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={{table: MarkdownTable}}>{msg.text}</ReactMarkdown> : msg.text}
        </div>
      </div>
    );
  };

  // Botón flotante para móvil
  if (isMobile && !mobileOpen) {
    return (
      <button 
        style={{
          position: 'fixed', 
          bottom: 20, 
          right: 20, 
          zIndex: 10002,
          background: '#232323', 
          color: '#fff', 
          borderRadius: 32,
          padding: '14px 22px', 
          fontWeight: 700, 
          fontSize: 17,
          border: 'none', 
          boxShadow: '0 2px 14px rgba(34,34,34,0.14)', 
          cursor: 'pointer'
        }} 
        onClick={() => setMobileOpen(true)}
      >
        💬 Chatea con Nema
      </button>
    );
  }

  // Vista móvil a pantalla completa
  if (isMobile && mobileOpen) {
    return (
      <div 
        className="mobile-chat-layout" 
        style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: `${windowHeight}px`,
          background: 'var(--card-bg, #faf9f6)', 
          zIndex: 10010,
          display: 'flex', 
          flexDirection: 'column'
        }}
      >
        <div 
          style={{ 
            background: '#232323', 
            color: '#fff', 
            padding: '13px 0 11px', 
            textAlign: 'center', 
            fontWeight: 800, 
            fontSize: 19, 
            position: 'relative',
            zIndex: 10021
          }}
        >
          Nema
          <button 
            onClick={() => setMobileOpen(false)} 
            style={{ 
              position: 'absolute', 
              right: 12, 
              top: 8, 
              background: 'none', 
              border: 'none', 
              color: '#fff', 
              fontSize: 26, 
              fontWeight: 700, 
              cursor: 'pointer' 
            }}
          >
            &times;
          </button>
        </div>
        
        <div 
          ref={chatContainerRef} 
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 8px 20px',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: '-ms-autohiding-scrollbar'
          }}
        >
          {messagesToShow.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
        
        <form 
          onSubmit={e => { e.preventDefault(); sendMessage(input); }} 
          style={{ 
            padding: '10px 8px 12px 8px', 
            background: 'var(--card-bg, #faf9f6)', 
            borderTop: '1px solid #eee',
            position: 'fixed',
            left: 0,
            bottom: 0,
            width: '100vw',
            zIndex: 10022,
            maxWidth: '100vw',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', width: '100%' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => {
                // Limitar manualmente a 150 caracteres para evitar pegar texto largo
                if (e.target.value.length <= 150) setInput(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={150}
              placeholder="¿A qué te dedicas?"
              style={{
                fontFamily: 'Manifold',
                fontSize: 18,
                padding: isMobile ? '12px 65px 12px 14px' : '12px 90px 12px 18px',
                background: '#fafbfc',
                boxShadow: 'none',
                outline: 'none',
                transition: 'border 0.2s',
                width: '100%',
                borderRadius: 24,
                border: '1.5px solid #e0e0e0',
              }}
            />
            {/* Character counter */}
            <span style={{
                position: 'absolute',
                right: isMobile ? 62 : 88,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: isMobile ? 12 : 13,
                color: input.length >= 150 ? '#d32f2f' : '#888',
                fontFamily: 'Manifold',
                background: 'rgba(255,255,255,0.8)',
                borderRadius: 10,
                padding: isMobile ? '1.5px 6px' : '2px 8px',
                pointerEvents: 'none',
                zIndex: 1,
                minWidth: 38,
                textAlign: 'center',
              }}>
              {input.length}/150
            </span>
            <button 
              type="submit" 
              style={{
                position: 'absolute', 
                right: 6, 
                top: '50%', 
                transform: 'translateY(-50%)',
                height: isMobile ? 32 : 38, 
                minWidth: isMobile ? 54 : 70, 
                fontWeight: 700, 
                fontSize: isMobile ? 15 : 17,
                borderRadius: 20, 
                background: '#232323', 
                color: '#fff', 
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                padding: isMobile ? '0 10px' : undefined,
                boxSizing: 'border-box',
              }} 
              disabled={loading}
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Vista desktop (sin cambios)
  return (
    <div style={{ 
      background: 'var(--card-bg, #faf9f6)', 
      borderRadius: 18, 
      boxShadow: '0 2px 24px 0 rgba(34,34,34,0.07)', 
      width: '100%', 
      minHeight: 320, 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'flex-end', 
      overflow: 'hidden' 
    }}>
      <div 
        ref={chatContainerRef} 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px 16px 12px 16px', 
          background: 'var(--card-bg, #faf9f6)', 
          scrollBehavior: 'smooth' 
        }}
      >
        {messagesToShow.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>
      <form 
        onSubmit={e => { e.preventDefault(); sendMessage(input); }} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '10px 16px 14px 16px', 
          background: 'var(--card-bg, #faf9f6)', 
          borderTop: '1px solid #eee' 
        }}
      >
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => {
              // Limitar manualmente a 150 caracteres para evitar pegar texto largo
              if (e.target.value.length <= 150) setInput(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            maxLength={150}
            placeholder="¿A qué te dedicas?"
            style={{
              fontFamily: 'Manifold',
              fontSize: 18, 
              padding: '12px 90px 12px 18px', 
              background: '#fafbfc',
              boxShadow: 'none', 
              outline: 'none', 
              transition: 'border 0.2s',
              width: '100%', 
              borderRadius: 24, 
              border: '1.5px solid #e0e0e0',
            }}
          />
          {/* Character counter */}
          <span style={{
              position: 'absolute',
              right: 88,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 13,
              color: input.length >= 150 ? '#d32f2f' : '#888',
              fontFamily: 'Manifold',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: 10,
              padding: '2px 8px',
              pointerEvents: 'none',
              zIndex: 1
            }}>
            {input.length}/150
          </span>
          <button 
            type="submit" 
            style={{
              position: 'absolute', 
              right: 6, 
              top: '50%', 
              transform: 'translateY(-50%)',
              height: 38, 
              minWidth: 70, 
              fontWeight: 700, 
              fontSize: 17,
              borderRadius: 20, 
              background: '#232323', 
              color: '#fff', 
              border: 'none',
              cursor: loading ? 'wait' : 'pointer'
            }} 
            disabled={loading}
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}