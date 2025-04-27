import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/chat-markdown-table.css'; // Ensure this path is correct relative to ChatWidget.jsx
import '../styles/welcome-glow.css'; // Ensure this path is correct

// Helper function to get or create a unique user ID stored in localStorage
const getUserId = () => {
  let id = localStorage.getItem('nemawashi_user_id');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('nemawashi_user_id', id);
  }
  return id;
};

// --- Welcome Message Examples ---
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

// Helper to get a single welcome case markdown string
function getSingleRowWelcomeCase(markdown) {
  return markdown;
}

// Helper to get a random welcome case
function getRandomWelcomeCase() {
  const raw = welcomeCases[Math.floor(Math.random() * welcomeCases.length)];
  return getSingleRowWelcomeCase(raw);
}

// --- Helper for Rendering Markdown Tables ---
// Flattens React node content to a string (useful for table headers)
function flattenCellContent(content) {
  if (content == null) return '';
  if (typeof content === 'string' || typeof content === 'number') return String(content);
  if (Array.isArray(content)) return content.map(flattenCellContent).join('');
  if (typeof content === 'object' && content.props && content.props.children) {
    return flattenCellContent(content.props.children);
  }
  return '';
}

// Custom React component to render markdown tables with specific styling
function MarkdownTable({node, ...props}) {
  // Extract header cells
  const headerRow = props.children?.[0];
  const headerCells = headerRow?.props?.children
    ? React.Children.toArray(headerRow.props.children).filter(Boolean)
    : [];

  // Extract body rows
  const bodyRows = props.children?.slice(1).filter(Boolean) || [];

  return (
    <table className="chat-markdown-table">
      <thead>
        <tr>
          {headerCells.map((th, i) => (
            <th key={i} style={{minWidth: i === 1 ? 18 : 120, padding: '7px 18px', textAlign: i === 1 ? 'center' : 'left'}}>
              {flattenCellContent(th.props.children)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {bodyRows.map((row, i) => {
          if (!row?.props?.children) return null;
          const cells = React.Children.toArray(row.props.children).filter(Boolean);
          return (
            <tr key={i}>
              {cells.map((cell, j) => {
                let cellContent = flattenCellContent(cell.props.children);
                // Assuming the second column (index 1) might be visually empty or different
                if (j === 1) {
                  return <td key={j} style={{minWidth: 18, padding: '7px 18px'}}></td>;
                }
                // Apply special classes/styling based on column index
                return (
                  <td key={j} className={j === 0 ? 'tick' : j === 2 ? 'benefit' : ''} style={{padding: '7px 18px'}}>
                    {j === 0 ? <span className="tick">✔</span> : null} {/* Checkmark in first column */}
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


// --- Main Chat Widget Component ---
export default function ChatWidget() {
  // State for messages in the chat
  const [messages, setMessages] = useState([
    {
      position: 'left', // Bot message
      type: 'text',
      markdown: true, // Contains markdown
      text:
        `👋 ¡Hola, soy **Nema**!\n\n` +
        `Dime a qué te dedicas, y te enseñaré cómo puedes ahorrar tiempo cada semana automatizando tareas, **sin que necesites conocimientos técnicos**.\n\n` +
        getRandomWelcomeCase() + '\n\n---', // Initial welcome message
      date: new Date(),
      title: 'Nema', // Sender name
    },
  ]);
  // State for the input field value
  const [input, setInput] = useState('');
  // State to indicate if waiting for a response
  const [loading, setLoading] = useState(false);
  // Refs for DOM elements
  const chatContainerRef = useRef(null); // Ref for the scrollable message area
  const messagesEndRef = useRef(null); // Ref for the empty div at the bottom to scroll to
  const inputRef = useRef(null); // Ref for the text input field
  // Get unique user ID
  const userId = getUserId();
  // State for mobile detection
  const [isMobile, setIsMobile] = useState(false);
  // State for mobile fullscreen chat view
  const [mobileOpen, setMobileOpen] = useState(false);

  // --- Effect for Mobile Detection ---
  useEffect(() => {
    const checkMobile = () => {
      // Update state only if the mobile status actually changes
      const mobileCheckResult = window.innerWidth <= 600;
      if (mobileCheckResult !== isMobile) {
          setIsMobile(mobileCheckResult);
      }
    };
    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile); // Check on resize

    // Optional: Listener for visual viewport changes for potentially better keyboard handling
    let visualViewportListener = null;
    if ('visualViewport' in window) {
        visualViewportListener = checkMobile; // Reuse the same check logic
        window.visualViewport.addEventListener('resize', visualViewportListener);
    }

    // Cleanup listeners on component unmount
    return () => {
      window.removeEventListener('resize', checkMobile);
      if (visualViewportListener && 'visualViewport' in window) {
          window.visualViewport.removeEventListener('resize', visualViewportListener);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]); // Rerun effect if isMobile changes (to ensure listener is attached correctly)


  // --- Scroll Function ---
  const scrollToBottom = (behavior = 'smooth') => {
    // Use a short timeout to ensure the DOM has updated before scrolling
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight, // Scroll to the very bottom
          behavior: behavior // Use specified behavior ('smooth' or 'auto')
        });
      }
    }, 50); // 50ms delay
  };

  // --- Effect for Scrolling on New Messages or Loading State Change ---
  useEffect(() => {
    // Determine scroll behavior: instant for user message, smooth otherwise
    const lastMessage = messages[messages.length - 1];
    const behavior = lastMessage?.position === 'right' ? 'auto' : 'smooth';
    scrollToBottom(behavior);
  }, [messages, loading]); // Trigger when messages array or loading state changes


  // --- Effect for Handling Body Styles and Focus when Mobile Chat Opens/Closes ---
  useEffect(() => {
    // Only apply these side effects when on mobile and the chat is open
    if (isMobile && mobileOpen) {
      // Store the original body overflow style to restore it later
      const originalBodyOverflow = document.body.style.overflow;

      // Prevent the main page body from scrolling while the chat overlay is open
      document.body.style.overflow = 'hidden';

      // Scroll chat to bottom and focus the input field after a brief delay
      // This allows the opening animation/layout to settle first
      const focusTimeout = setTimeout(() => {
        scrollToBottom('auto'); // Instant scroll on open
        if (inputRef.current) {
             inputRef.current.focus({ preventScroll: true }); // Focus without jarring scroll
        }
      }, 250); // Delay in milliseconds

      // Cleanup function: This runs when the effect dependencies change or the component unmounts
      return () => {
        clearTimeout(focusTimeout); // Clear the timeout if cleanup runs before it fires
        document.body.style.overflow = originalBodyOverflow; // Restore original body overflow
      };
    } else {
      // Explicitly ensure body overflow is reset if the chat is closed or not on mobile
      // Handles cases where the state might change back quickly
      document.body.style.overflow = ''; // Revert to default or previously set style
    }
  }, [isMobile, mobileOpen]); // Dependencies: This effect runs when isMobile or mobileOpen changes


  // --- Function to Send Message to Backend ---
  const sendMessage = async (text) => {
    const trimmedText = text.trim();
    if (!trimmedText) return; // Don't send empty messages

    // 1. Add User Message to UI Immediately
    const newUserMessage = {
      position: 'right',
      type: 'text',
      text: trimmedText,
      date: new Date(),
      title: 'Tú', // "You" in Spanish
    };
    setMessages((msgs) => [...msgs, newUserMessage]);

    // 2. Set Loading State & Clear Input
    setLoading(true);
    setInput('');
    // Scrolling is handled by the useEffect watching 'messages'

    // 3. Send to Backend API
    try {
      // Replace '/api/chat-proxy' with your actual API endpoint
      const res = await fetch('/api/chat-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedText, userId }), // Send message content and user ID
      });

      // Handle potential HTTP errors
      if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      // Extract the reply text (adjust logic based on your API response structure)
      const reply =
        data.raw ||
        (Array.isArray(data) && data[0]?.response) ||
        data.response ||
        (typeof data === 'string' ? data : 'Gracias, tu mensaje ha sido recibido.'); // Fallback message

      // 4. Add Bot Response to UI
      setMessages((msgs) => [
        ...msgs,
        {
          position: 'left',
          type: 'text',
          text: reply,
          markdown: true, // Assume bot responses might contain Markdown
          date: new Date(),
          title: 'Nema', // Bot name
        },
      ]);
      // Scrolling is handled by the useEffect watching 'messages'

    } catch (error) {
       console.error("Error sending message:", error); // Log the error for debugging
       // 4b. Add Error Message to UI
      setMessages((msgs) => [
        ...msgs,
        {
          position: 'left',
          type: 'text',
          text: 'Hubo un error al contactar al agente. Por favor, intenta más tarde.', // User-friendly error
          markdown: false, // Error message is plain text
          date: new Date(),
          title: 'Nema',
        },
      ]);
       // Scrolling is handled by the useEffect watching 'messages'
    } finally {
        // 5. Reset Loading State & Refocus Input
        setLoading(false);
        // Refocus logic depends on platform
        if (isMobile && mobileOpen) {
             // Small delay might be necessary on mobile after keyboard dismisses/interactions
            setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
        } else if (!isMobile) {
            inputRef.current?.focus(); // Focus immediately on desktop
        }
    }
  };

  // --- Handle Enter Key Press in Input Field ---
  const handleKeyDown = (e) => {
    // Send message if Enter is pressed without the Shift key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default Enter behavior (e.g., adding newline)
      sendMessage(input);
    }
  };

  // --- Function to Render Individual Chat Messages ---
  const renderMessage = (msg, i) => {
    const isBot = msg.position === 'left';
    const isUser = msg.position === 'right';

    // A. Render the "Thinking" indicator if msg.thinking is true
    if (msg.thinking) {
      return (
        <div key={`thinking-${i}`} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 22, marginRight: 6, alignSelf: 'flex-end' }}>🌱</div> {/* Bot icon */}
          <div style={{ background: '#e0e0e0', color: '#444', borderRadius: 18, padding: '10px 18px', fontSize: '1rem', maxWidth: isMobile ? 'calc(75vw - 30px)' : '500px', boxShadow: '0 1px 6px rgba(34,34,34,0.04)', fontStyle: 'italic', opacity: 0.8, animation: 'fadeInUp 0.3s ease-out', fontFamily: 'Manifold, var(--font-main)', fontWeight: 300 }}>
            Nema está pensando<span className="thinking-dots"></span> {/* CSS class handles dot animation */}
          </div>
        </div>
      );
    }

    // B. Render a standard message bubble
    // Define common styles for message bubbles
    const messageStyle = {
      background: isUser ? 'var(--primary, #444)' : '#e0e7ef', // Use CSS variables for colors
      color: isUser ? '#fff' : 'var(--text-main, #444)',
      borderRadius: 18,
      padding: '10px 18px',
      fontSize: '1rem',
      maxWidth: isMobile ? 'calc(75vw - 30px)' : '500px', // Limit bubble width
      boxShadow: '0 1px 6px rgba(34,34,34,0.04)',
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
      fontFamily: 'Manifold, var(--font-main)',
      fontWeight: isBot ? 400 : 500, // Slightly different weights
      minWidth: '40px', // Avoid tiny bubbles
      display: 'inline-block', // Prevent full width stretching
      textAlign: 'left', // Align text inside bubble
    };

    // Structure for the message row
    return (
      <div key={i} style={{ animation: 'fadeInUp 0.3s ease-out', display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16, paddingLeft: isBot ? 0 : '10%', paddingRight: isUser ? 0 : '10%' }}>
        {/* Show bot icon only for bot messages */}
        {isBot && <div style={{ fontSize: 22, marginRight: 6, alignSelf: 'flex-end' }}>🌱</div>}
        {/* The message bubble itself */}
        <div style={messageStyle}>
          {/* Render content: Use ReactMarkdown if markdown: true, otherwise plain text */}
          {msg.markdown ? (
             <ReactMarkdown
                 remarkPlugins={[remarkGfm]} // Enable GitHub Flavored Markdown features
                 components={{
                     table: MarkdownTable, // Custom table renderer
                     a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" style={{color: isUser ? '#fff' : 'var(--primary, #444)', textDecoration: 'underline'}}/> // Style links
                 }}
             >
                 {msg.text}
             </ReactMarkdown>
           ) : (
            msg.text // Render plain text
           )}
        </div>
      </div>
    );
  };


  // --- RENDER LOGIC ---

  // 1. Render Floating Action Button (FAB) if mobile and chat is closed
  if (isMobile && !mobileOpen) {
    return (
      <button
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 10002, background: '#232323', color: '#fff', borderRadius: 32, padding: '14px 22px', fontWeight: 700, fontSize: 17, border: 'none', boxShadow: '0 2px 14px rgba(34,34,34,0.14)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
        }}
        onClick={() => setMobileOpen(true)} // Open the chat
        aria-label="Abrir chat con Nema"
      >
        💬 Chatea con Nema
      </button>
    );
  }

  // 2. Render Fullscreen Mobile Chat View if mobile and chat is open
  if (isMobile && mobileOpen) {
    return (
      <div
        className="mobile-chat-layout"
        style={{
          position: 'fixed', // Use fixed positioning for overlay
          top: 0,
          left: 0,
          width: '100vw', // Full viewport width
          height: '100dvh', // Full DYNAMIC viewport height (adapts to keyboard)
          background: 'var(--bg-light, #fffaf3)', // Background color from CSS variable
          zIndex: 10010, // High z-index to be on top of everything
          display: 'flex',
          flexDirection: 'column', // Stack elements vertically
          overflow: 'hidden', // Prevent the main container itself from scrolling
        }}
      >
        {/* Header Bar */}
        <div style={{ background: '#232323', color: '#fff', padding: '13px 0 11px', textAlign: 'center', fontWeight: 800, fontSize: 19, position: 'relative', zIndex: 2, flexShrink: 0 }}>
          Nema {/* Title */}
          {/* Close Button */}
          <button onClick={() => setMobileOpen(false)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#fff', fontSize: 26, fontWeight: 700, cursor: 'pointer', padding: '0 5px' }} aria-label="Cerrar chat">
            × {/* Close icon */}
          </button>
        </div>

        {/* Messages Area (Scrollable) */}
        <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 8px 10px 8px', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', background: 'var(--bg-light, #fffaf3)' }}>
          {messages.map(renderMessage)} {/* Render all messages */}
          {loading && renderMessage({ thinking: true }, 'thinking')} {/* Show thinking indicator */}
          <div ref={messagesEndRef} style={{ height: '1px' }} /> {/* Scroll target */}
        </div>

        {/* Input Form Area (Sticks to Bottom) */}
        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} style={{ padding: '10px 8px 10px 8px', background: 'var(--card-bg, #faf9f6)', borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, position: 'sticky', bottom: 0, zIndex: 2 }}>
          {/* Input Field Wrapper */}
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => { if (e.target.value.length <= 150) setInput(e.target.value); }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={150}
              placeholder="¿A qué te dedicas?"
              style={{ fontFamily: 'Manifold, var(--font-main)', fontSize: 17, padding: '10px 45px 10px 14px', background: '#fff', boxShadow: 'none', outline: 'none', width: '100%', borderRadius: 20, border: '1.5px solid #e0e0e0', boxSizing: 'border-box', appearance: 'none' }}
            />
            {/* Character Counter */}
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: input.length >= 150 ? '#d32f2f' : '#aaa', fontFamily: 'Manifold, var(--font-main)', background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '1px 4px', pointerEvents: 'none', zIndex: 1, minWidth: '30px', textAlign: 'center' }}>
              {input.length}/150
            </span>
          </div>
          {/* Submit Button */}
          <button type="submit" style={{ height: 40, minWidth: 50, fontWeight: 700, fontSize: 16, borderRadius: 20, background: '#232323', color: '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer', padding: '0 12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={loading} aria-label="Enviar mensaje">
             {/* Send Icon */}
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    );
  }

  // 3. Render Desktop Chat Widget View (default case when not mobile or mobile chat closed)
  return (
    <div style={{ background: 'var(--bg-light, #fffaf3)', borderRadius: 18, boxShadow: '0 2px 24px 0 rgba(34,34,34,0.07)', width: '100%', minHeight: 320, maxHeight: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Messages Area (Scrollable) */}
      <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 12px 16px', background: 'var(--bg-light, #fffaf3)', scrollBehavior: 'smooth' }}>
        {messages.map(renderMessage)}
        {loading && renderMessage({ thinking: true }, 'thinking')}
        <div ref={messagesEndRef} style={{ height: '1px' }}/>
      </div>
      {/* Input Form Area */}
      <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px 14px 16px', background: 'var(--card-bg, #faf9f6)', borderTop: '1px solid #eee', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        {/* Input field wrapper */}
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => { if (e.target.value.length <= 150) setInput(e.target.value); }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            maxLength={150}
            placeholder="¿A qué te dedicas?"
            style={{ fontFamily: 'Manifold, var(--font-main)', fontSize: 18, padding: '12px 120px 12px 18px', background: '#fff', boxShadow: 'none', outline: 'none', width: '100%', borderRadius: 24, border: '1.5px solid #e0e0e0', boxSizing: 'border-box' }}
          />
          {/* Character counter */}
          <span style={{ position: 'absolute', right: 85, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: input.length >= 150 ? '#d32f2f' : '#aaa', fontFamily: 'Manifold, var(--font-main)', background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '2px 6px', pointerEvents: 'none', zIndex: 1, minWidth: '35px', textAlign: 'center' }}>
            {input.length}/150
          </span>
          {/* Send Button */}
           <button type="submit" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', height: 38, minWidth: 70, fontWeight: 700, fontSize: 17, borderRadius: 20, background: '#232323', color: '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer', padding: '0 15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={loading} aria-label="Enviar mensaje">
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}