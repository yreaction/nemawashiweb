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
  const headerRow = props.children[0];
  const headerCells = headerRow && headerRow.props && headerRow.props.children
    ? React.Children.toArray(headerRow.props.children).filter(Boolean)
    : [];
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
  const messagesEndRef = useRef(null); // Keep this ref for signaling *where* to scroll to
  const inputRef = useRef(null);
  const userId = getUserId();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      const mobileCheck = window.innerWidth <= 600;
      // Update mobile state only if it changes
      if (mobileCheck !== isMobile) {
         setIsMobile(mobileCheck);
      }
      setWindowHeight(window.innerHeight); // Update height on resize
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Add resize listener for height specifically for mobile keyboard handling
    if ('visualViewport' in window) {
        window.visualViewport.addEventListener('resize', checkMobile);
    }


    return () => {
      window.removeEventListener('resize', checkMobile);
      if ('visualViewport' in window) {
          window.visualViewport.removeEventListener('resize', checkMobile);
      }
    };
  }, [isMobile]); // Re-run checkMobile if isMobile changes

  // --- *** MODIFIED SCROLL FUNCTION *** ---
  const scrollToBottom = (behavior = 'smooth') => {
    // Use a slight delay to ensure the DOM has updated, especially after receiving messages
    setTimeout(() => {
      if (chatContainerRef.current) {
        // Scroll the container so the bottom is in view
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: behavior
        });
      }
    }, 50); // 50ms delay often helps
  };

  // Effect for scroll automatico when messages change or loading ends
  useEffect(() => {
    // Scroll immediately (no smooth) if adding user message, smooth otherwise
    const lastMessage = messages[messages.length - 1];
    const behavior = lastMessage?.position === 'right' ? 'auto' : 'smooth';
    scrollToBottom(behavior);
  }, [messages, loading]); // Trigger on message/loading changes

  // Effect for managing scroll/focus when mobile chat opens/closes
  useEffect(() => {
    if (isMobile) {
      if (mobileOpen) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        // Using 100dvh attempts to use the dynamic viewport height
        document.documentElement.style.height = '100dvh';
        document.documentElement.style.position = 'fixed'; // Prevent body scroll leak
        document.documentElement.style.width = '100%';

        // Scroll and focus after opening animation/layout settles
        setTimeout(() => {
          scrollToBottom('auto'); // Instant scroll on open
          inputRef.current?.focus({ preventScroll: true });
        }, 250); // Delay might need adjustment
      } else {
        // Restore body scrolling when closing
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.height = '';
        document.documentElement.style.position = '';
        document.documentElement.style.width = '';
      }
    }

    // Cleanup function to ensure styles are reset if component unmounts while open
    return () => {
       if (isMobile) { // Only reset if it was mobile
         document.body.style.overflow = '';
         document.documentElement.style.overflow = '';
         document.documentElement.style.height = '';
         document.documentElement.style.position = '';
         document.documentElement.style.width = '';
       }
    };
  }, [isMobile, mobileOpen]);


  const sendMessage = async (text) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const newUserMessage = {
      position: 'right',
      type: 'text',
      text: trimmedText,
      date: new Date(),
      title: 'Tú',
    };

    setMessages((msgs) => [...msgs, newUserMessage]);
    setLoading(true);
    setInput('');

    // Scroll immediately after adding user message
    // scrollToBottom('auto'); // Removed - handled by useEffect now

    try {
      const res = await fetch('/api/chat-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedText, userId }),
      });

      if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
      }

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
          text: reply, // Use raw response directly
          markdown: true, // Assume response can be markdown
          date: new Date(),
          title: 'Nema',
        },
      ]);
       // Scroll smoothly after bot reply - Handled by useEffect
    } catch (error) {
       console.error("Error sending message:", error);
      setMessages((msgs) => [
        ...msgs,
        {
          position: 'left',
          type: 'text',
          text: 'Hubo un error al contactar al agente. Por favor, intenta más tarde.',
          date: new Date(),
          title: 'Nema',
        },
      ]);
       // Scroll smoothly after error message - Handled by useEffect
    } finally {
        setLoading(false);
         // Ensure input is focused after sending, especially on mobile
        if (isMobile && mobileOpen) {
            setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
        } else if (!isMobile) {
            inputRef.current?.focus();
        }
    }
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
          marginBottom: 12,
          paddingLeft: isBot ? 0 : 'auto', // Align thinking bubble left
          paddingRight: isBot ? 'auto' : 0,
        }}>
          <div style={{ fontSize: 22, marginRight: 6 }}>🌱</div>
          <div style={{
            background: '#e0e0e0',
            color: '#444',
            borderRadius: 18,
            padding: '10px 18px',
            fontSize: '1rem', // Consistent font size
            maxWidth: isMobile ? 'calc(75vw - 30px)' : '500px', // Adjust max width slightly
            boxShadow: '0 1px 6px rgba(34,34,34,0.04)',
            fontStyle: 'italic',
            opacity: 0.8,
            animation: 'fadeInUp 0.3s ease-out',
            fontFamily: 'Manifold, var(--font-main)',
            fontWeight: 300
          }}>
            Nema está pensando<span className="thinking-dots"></span>
          </div>
        </div>
      );
    }

    // Simplified message rendering logic
    const messageStyle = {
      background: isUser ? 'var(--primary, #444)' : '#e0e7ef',
      color: isUser ? '#fff' : 'var(--text-main, #444)',
      borderRadius: 18,
      padding: '10px 18px',
      fontSize: '1rem', // Consistent font size
      maxWidth: isMobile ? 'calc(75vw - 30px)' : '500px', // Consistent max width
      boxShadow: '0 1px 6px rgba(34,34,34,0.04)',
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
      fontFamily: 'Manifold, var(--font-main)',
      fontWeight: isBot ? 400 : 500,
      minWidth: '40px', // Ensure even small messages have some width
      display: 'inline-block', // Prevent full width stretching
      textAlign: 'left', // Ensure text aligns left within the bubble
    };

    return (
      <div key={i} style={{
        animation: 'fadeInUp 0.3s ease-out',
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
        paddingLeft: isBot ? 0 : '10%', // Add padding to push user messages right
        paddingRight: isUser ? 0 : '10%', // Add padding to push bot messages left
      }}>
        {isBot && <div style={{ fontSize: 22, marginRight: 6, alignSelf: 'flex-end' }}>🌱</div>}
        <div style={messageStyle}>
          {msg.markdown ? (
             <ReactMarkdown
                 remarkPlugins={[remarkGfm]}
                 components={{
                     table: MarkdownTable,
                     // Add other components if needed, e.g., links
                     a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" style={{color: isUser ? '#fff' : 'var(--primary, #444)', textDecoration: 'underline'}}/>
                 }}
             >
                 {msg.text}
             </ReactMarkdown>
           ) : (
            msg.text // Render plain text if not markdown
           )}
        </div>
      </div>
    );
  };


  // Botón flotante para móvil (No changes needed here)
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

  // --- *** MODIFIED MOBILE FULLSCREEN VIEW *** ---
  if (isMobile && mobileOpen) {
    return (
      <div
        className="mobile-chat-layout"
        style={{
          position: 'fixed', // Use fixed for the whole container
          top: 0,
          left: 0,
          width: '100vw',
          height: `${windowHeight}px`, // Use dynamic height
          background: 'var(--bg-light, #fffaf3)', // Use main bg
          zIndex: 10010,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // Prevent outer scroll
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#232323',
            color: '#fff',
            padding: '13px 0 11px',
            textAlign: 'center',
            fontWeight: 800,
            fontSize: 19,
            position: 'relative', // For close button positioning
            zIndex: 2, // Above content
            flexShrink: 0, // Prevent header from shrinking
          }}
        >
          Nema
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)', // Better vertical alignment
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 26,
              fontWeight: 700,
              cursor: 'pointer',
              padding: '0 5px' // Easier to tap
            }}
            aria-label="Cerrar chat" // Accessibility
          >
            ×
          </button>
        </div>

        {/* Messages Area */}
        <div
          ref={chatContainerRef}
          style={{
            flex: 1, // Take remaining space
            overflowY: 'auto', // Enable scrolling *only* here
            padding: '18px 8px 10px 8px', // Consistent padding, less bottom padding needed
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
             background: 'var(--bg-light, #fffaf3)', // Ensure background consistency
          }}
        >
          {/* Render messages, including potential thinking indicator */}
          {messages.map(renderMessage)}
          {loading && renderMessage({ thinking: true }, 'thinking')}
          {/* This empty div is a target for scrolling */}
          <div ref={messagesEndRef} style={{ height: '1px' }} />
        </div>

        {/* Input Form Area */}
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          style={{
            padding: '10px 8px 10px 8px', // Adjust padding slightly
            background: 'var(--card-bg, #faf9f6)',
            borderTop: '1px solid #eee',
            display: 'flex', // Use flexbox for alignment
            alignItems: 'center', // Align items vertically
            gap: '8px', // Space between input and button
            flexShrink: 0, // Prevent form from shrinking
            position: 'sticky', // Stick to bottom *within the flex container*
            bottom: 0, // Make it stick to the bottom edge
            zIndex: 2, // Above content
          }}
        >
          {/* Input Wrapper (for counter positioning if needed) */}
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => {
                if (e.target.value.length <= 150) setInput(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={150}
              placeholder="¿A qué te dedicas?"
              style={{
                fontFamily: 'Manifold, var(--font-main)',
                fontSize: 17, // Slightly smaller for mobile
                padding: '10px 45px 10px 14px', // Adjusted padding: R needs space for counter
                background: '#fff', // Clearer background
                boxShadow: 'none',
                outline: 'none',
                width: '100%', // Fill available space
                borderRadius: 20, // Slightly smaller radius
                border: '1.5px solid #e0e0e0',
                boxSizing: 'border-box', // Include padding/border in width
                appearance: 'none', // Reset default styles
              }}
            />
            {/* Character counter */}
            <span style={{
              position: 'absolute',
              right: 10, // Position inside the padding area
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 11, // Smaller counter
              color: input.length >= 150 ? '#d32f2f' : '#aaa', // Lighter gray
              fontFamily: 'Manifold, var(--font-main)',
              background: 'rgba(255,255,255,0.6)', // Slight background
              borderRadius: 8,
              padding: '1px 4px',
              pointerEvents: 'none',
              zIndex: 1,
              minWidth: '30px', // Min width for counter
              textAlign: 'center',
            }}>
              {input.length}/150
            </span>
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            style={{
              height: 40, // Match input height roughly
              minWidth: 50, // Fixed width for the button
              fontWeight: 700,
              fontSize: 16, // Adjusted size
              borderRadius: 20, // Match input radius
              background: '#232323',
              color: '#fff',
              border: 'none',
              cursor: loading ? 'wait' : 'pointer',
              padding: '0 12px', // Horizontal padding
              flexShrink: 0, // Prevent button shrinking
              display: 'flex', // To center icon/text if needed
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={loading}
            aria-label="Enviar mensaje" // Accessibility
          >
             {/* Simple send icon or text */}
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
             {/* Alternatively: Enviar */}
          </button>
        </form>
      </div>
    );
  }


  // --- *** MODIFIED DESKTOP VIEW *** ---
  return (
    <div style={{
      background: 'var(--bg-light, #fffaf3)', // Use main light bg
      borderRadius: 18,
      boxShadow: '0 2px 24px 0 rgba(34,34,34,0.07)',
      width: '100%',
      minHeight: 320, // Keep min height
      maxHeight: '70vh', // Add max height to prevent excessive growth
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden' // Important: container handles overflow
    }}>
      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1, // Takes up available space
          overflowY: 'auto', // Allows scrolling *within this div*
          padding: '24px 16px 12px 16px',
          background: 'var(--bg-light, #fffaf3)', // Match container background
          scrollBehavior: 'smooth'
        }}
      >
        {messages.map(renderMessage)}
         {loading && renderMessage({ thinking: true }, 'thinking')}
        {/* Scroll target */}
        <div ref={messagesEndRef} style={{ height: '1px' }}/>
      </div>

      {/* Input Form Area */}
      <form
        onSubmit={e => { e.preventDefault(); sendMessage(input); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px 14px 16px',
          background: 'var(--card-bg, #faf9f6)', // Use card bg for input area
          borderTop: '1px solid #eee',
          flexShrink: 0, // Prevent shrinking
          position: 'relative', // Needed for counter positioning context
          zIndex: 1, // Ensure above scrolled content slightly if needed
        }}
      >
        {/* Input field takes most space */}
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => {
              if (e.target.value.length <= 150) setInput(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            maxLength={150}
            placeholder="¿A qué te dedicas?"
            style={{
              fontFamily: 'Manifold, var(--font-main)',
              fontSize: 18,
              // *** INCREASED RIGHT PADDING ***
              padding: '12px 120px 12px 18px', // More space for counter + button
              background: '#fff', // Use white background for input field
              boxShadow: 'none',
              outline: 'none',
              width: '100%', // Takes full width of its container
              borderRadius: 24,
              border: '1.5px solid #e0e0e0',
              boxSizing: 'border-box', // Include padding in width calc
            }}
          />
          {/* Character counter - Positioned relative to the input wrapper */}
          <span style={{
            position: 'absolute',
            // *** ADJUSTED RIGHT POSITION ***
            right: 85, // Positioned before the button area
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 13,
            color: input.length >= 150 ? '#d32f2f' : '#aaa', // Lighter gray
            fontFamily: 'Manifold, var(--font-main)',
            background: 'rgba(255,255,255,0.6)', // Slight background
            borderRadius: 10,
            padding: '2px 6px', // Slightly less padding
            pointerEvents: 'none', // Doesn't block typing
            zIndex: 1, // Above input text
            minWidth: '35px',
            textAlign: 'center',
          }}>
            {input.length}/150
          </span>
          {/* Send Button - Positioned absolutely relative to the form */}
           <button
            type="submit"
            style={{
              position: 'absolute',
              right: 6, // Keep close to edge
              top: '50%',
              transform: 'translateY(-50%)',
              height: 38,
              minWidth: 70,
              fontWeight: 700,
              fontSize: 17,
              borderRadius: 20, // Match input style
              background: '#232323',
              color: '#fff',
              border: 'none',
              cursor: loading ? 'wait' : 'pointer',
              padding: '0 15px', // Padding for text/icon inside button
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={loading}
            aria-label="Enviar mensaje"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}