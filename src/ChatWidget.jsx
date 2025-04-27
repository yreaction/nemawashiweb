import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/chat-markdown-table.css'; // Ensure this path is correct
import '../styles/welcome-glow.css'; // Ensure this path is correct

// Helper function to get or create a unique user ID
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

function getSingleRowWelcomeCase(markdown) {
  return markdown;
}

function getRandomWelcomeCase() {
  const raw = welcomeCases[Math.floor(Math.random() * welcomeCases.length)];
  return getSingleRowWelcomeCase(raw);
}

// --- Helper for Markdown Tables ---
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
                if (j === 1) { // Assuming the second column (index 1) might be intentionally empty visually
                  return <td key={j} style={{minWidth: 18, padding: '7px 18px'}}></td>;
                }
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
  const [messages, setMessages] = useState([
    {
      position: 'left',
      type: 'text',
      markdown: true, // Signal that this message uses Markdown
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
  const chatContainerRef = useRef(null); // Ref for the scrollable message area
  const messagesEndRef = useRef(null); // Ref for the target element to scroll to
  const inputRef = useRef(null); // Ref for the text input field
  const userId = getUserId(); // Get unique user ID
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // State for mobile fullscreen view

  // --- Effect for Mobile Detection ---
  useEffect(() => {
    const checkMobile = () => {
      const mobileCheck = window.innerWidth <= 600;
      if (mobileCheck !== isMobile) {
         setIsMobile(mobileCheck);
      }
      // We might use visualViewport later for fine-tuning, but not essential now
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Optional: Listener for visual viewport changes (can help with complex keyboard scenarios)
    let visualViewportListener = null;
    if ('visualViewport' in window) {
        visualViewportListener = () => checkMobile();
        window.visualViewport.addEventListener('resize', visualViewportListener);
    }

    // Cleanup listeners on component unmount
    return () => {
      window.removeEventListener('resize', checkMobile);
      if (visualViewportListener && 'visualViewport' in window) {
          window.visualViewport.removeEventListener('resize', visualViewportListener);
      }
    };
  }, [isMobile]); // Re-run checkMobile if isMobile state changes


  // --- Scroll Function ---
  const scrollToBottom = (behavior = 'smooth') => {
    // Use a slight delay to allow DOM updates before scrolling
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: behavior
        });
      }
    }, 50); // 50ms delay is often sufficient
  };

  // --- Effect for Scrolling on New Messages/Loading ---
  useEffect(() => {
    // Determine scroll behavior: instant for user message, smooth otherwise
    const lastMessage = messages[messages.length - 1];
    const behavior = lastMessage?.position === 'right' ? 'auto' : 'smooth';
    scrollToBottom(behavior);
  }, [messages, loading]); // Trigger when messages array or loading state changes


  // --- Effect for Handling Body Styles and Focus when Mobile Chat Opens/Closes ---
  useEffect(() => {
    if (isMobile && mobileOpen) {
      // Store original body/html styles to restore later
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const originalBodyHeight = document.body.style.height;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalHtmlHeight = document.documentElement.style.height;

      // Apply styles to prevent background scrolling when chat is open
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed'; // Helps lock the body content
      document.body.style.height = '100%';
      document.documentElement.style.overflow = 'hidden'; // Also lock the html element
      document.documentElement.style.height = '100%';

      // Scroll to bottom and focus input after a short delay (allows layout to settle)
      const focusTimeout = setTimeout(() => {
        scrollToBottom('auto'); // Instant scroll
        if (inputRef.current) {
             inputRef.current.focus({ preventScroll: true }); // Focus without triggering scroll
        }
      }, 250); // Adjust delay if needed

      // Cleanup function: Restore original styles when chat closes or component unmounts
      return () => {
        clearTimeout(focusTimeout); // Clear timeout if component unmounts quickly
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.height = originalBodyHeight;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.documentElement.style.height = originalHtmlHeight;
      };

    }
    // No else needed: cleanup function handles restoration
  }, [isMobile, mobileOpen]); // Dependency array ensures this runs when mobile state or open state changes


  // --- Function to Send Message to Backend ---
  const sendMessage = async (text) => {
    const trimmedText = text.trim();
    if (!trimmedText) return; // Don't send empty messages

    // Add user message immediately to the UI
    const newUserMessage = {
      position: 'right',
      type: 'text',
      text: trimmedText,
      date: new Date(),
      title: 'Tú', // You
    };
    setMessages((msgs) => [...msgs, newUserMessage]);
    setLoading(true); // Show thinking indicator
    setInput(''); // Clear input field

    // Scroll handled by useEffect watching 'messages'

    try {
      // Replace '/api/chat-proxy' with your actual backend endpoint
      const res = await fetch('/api/chat-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedText, userId }), // Send message and user ID
      });

      if (!res.ok) {
          // Handle HTTP errors (e.g., 4xx, 5xx)
          throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      // Extract the reply text (adjust based on your actual API response structure)
      const reply =
        data.raw || // Prefer raw field if available
        (Array.isArray(data) && data[0]?.response) || // Handle array responses
        data.response || // Standard response field
        (typeof data === 'string' ? data : 'Gracias, tu mensaje ha sido recibido.'); // Fallback

      // Add bot reply to the UI
      setMessages((msgs) => [
        ...msgs,
        {
          position: 'left',
          type: 'text',
          text: reply,
          markdown: true, // Assume bot responses can be Markdown
          date: new Date(),
          title: 'Nema', // Bot name
        },
      ]);
       // Scroll handled by useEffect watching 'messages'

    } catch (error) {
       console.error("Error sending message:", error); // Log error for debugging
       // Add error message to the UI
      setMessages((msgs) => [
        ...msgs,
        {
          position: 'left',
          type: 'text',
          text: 'Hubo un error al contactar al agente. Por favor, intenta más tarde.',
          markdown: false, // Error message is plain text
          date: new Date(),
          title: 'Nema',
        },
      ]);
       // Scroll handled by useEffect watching 'messages'
    } finally {
        setLoading(false); // Hide thinking indicator
         // Refocus the input field after sending/receiving
        if (isMobile && mobileOpen) {
             // Small delay might be needed on mobile after keyboard interaction
            setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
        } else if (!isMobile) {
            inputRef.current?.focus(); // Focus immediately on desktop
        }
    }
  };

  // --- Handle Enter Key Press in Input ---
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Send on Enter, allow Shift+Enter for new lines
      e.preventDefault(); // Prevent default Enter behavior (like form submission)
      sendMessage(input);
    }
  };

  // --- Function to Render Individual Messages ---
  const renderMessage = (msg, i) => {
    const isBot = msg.position === 'left';
    const isUser = msg.position === 'right';

    // Render the "thinking" indicator
    if (msg.thinking) {
      return (
        <div key={`thinking-${i}`} style={{
          display: 'flex',
          justifyContent: 'flex-start', // Always align left for bot thinking
          alignItems: 'center',
          marginBottom: 12,
        }}>
          {/* Bot Icon */}
          <div style={{ fontSize: 22, marginRight: 6, alignSelf: 'flex-end' }}>🌱</div>
          {/* Thinking Bubble */}
          <div style={{
            background: '#e0e0e0',
            color: '#444',
            borderRadius: 18,
            padding: '10px 18px',
            fontSize: '1rem', // Consistent font size
            maxWidth: isMobile ? 'calc(75vw - 30px)' : '500px', // Max width calculation
            boxShadow: '0 1px 6px rgba(34,34,34,0.04)',
            fontStyle: 'italic',
            opacity: 0.8,
            animation: 'fadeInUp 0.3s ease-out', // Simple fade-in animation
            fontFamily: 'Manifold, var(--font-main)', // Use defined font stack
            fontWeight: 300
          }}>
            Nema está pensando<span className="thinking-dots"></span> {/* CSS handles the dots animation */}
          </div>
        </div>
      );
    }

    // --- Common styles for message bubbles ---
    const messageStyle = {
      background: isUser ? 'var(--primary, #444)' : '#e0e7ef', // Different colors for user/bot
      color: isUser ? '#fff' : 'var(--text-main, #444)',
      borderRadius: 18,
      padding: '10px 18px',
      fontSize: '1rem', // Standard font size
      maxWidth: isMobile ? 'calc(75vw - 30px)' : '500px', // Max width limits bubble size
      boxShadow: '0 1px 6px rgba(34,34,34,0.04)', // Subtle shadow
      overflowWrap: 'break-word', // Allow long words to wrap
      wordBreak: 'break-word', // Ensure words break correctly
      fontFamily: 'Manifold, var(--font-main)', // Use defined font stack
      fontWeight: isBot ? 400 : 500, // Slightly bolder user text
      minWidth: '40px', // Prevent tiny bubbles for short messages
      display: 'inline-block', // Prevent bubble from taking full width
      textAlign: 'left', // Align text inside the bubble to the left
    };

    // --- Render the actual message row ---
    return (
      <div key={i} style={{
        animation: 'fadeInUp 0.3s ease-out', // Fade-in animation for new messages
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start', // Align user right, bot left
        marginBottom: 16,
        paddingLeft: isBot ? 0 : '10%', // Indent user messages from the left
        paddingRight: isUser ? 0 : '10%', // Indent bot messages from the right
      }}>
        {/* Bot Icon (only show if message is from bot) */}
        {isBot && <div style={{ fontSize: 22, marginRight: 6, alignSelf: 'flex-end' }}>🌱</div>}

        {/* Message Bubble */}
        <div style={messageStyle}>
          {/* Conditional rendering: Use ReactMarkdown if markdown flag is true */}
          {msg.markdown ? (
             <ReactMarkdown
                 remarkPlugins={[remarkGfm]} // Enable GitHub Flavored Markdown (tables, etc.)
                 components={{
                     // Custom renderer for tables
                     table: MarkdownTable,
                     // Custom renderer for links (open in new tab)
                     a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" style={{color: isUser ? '#fff' : 'var(--primary, #444)', textDecoration: 'underline'}}/>
                 }}
             >
                 {msg.text}
             </ReactMarkdown>
           ) : (
            msg.text // Render as plain text otherwise
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
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 10002, // High z-index to be on top
          background: '#232323', // Dark background
          color: '#fff', // White text/icon
          borderRadius: 32, // Circular shape
          padding: '14px 22px', // Padding for size
          fontWeight: 700, // Bold text
          fontSize: 17,
          border: 'none', // No border
          boxShadow: '0 2px 14px rgba(34,34,34,0.14)', // Shadow for depth
          cursor: 'pointer', // Indicate interactivity
          display: 'flex', // For aligning icon and text if needed
          alignItems: 'center',
          gap: '8px'
        }}
        onClick={() => setMobileOpen(true)} // Open the chat on click
        aria-label="Abrir chat con Nema" // Accessibility label
      >
        💬 Chatea con Nema
      </button>
    );
  }

  // 2. Render Fullscreen Mobile Chat View if mobile and chat is open
  if (isMobile && mobileOpen) {
    return (
      <div
        className="mobile-chat-layout" // Identifier class
        style={{
          position: 'absolute', // Position absolutely within the locked body
          top: 0,
          left: 0,
          width: '100%',
          height: '100%', // Fill the locked body dimensions
          background: 'var(--bg-light, #fffaf3)', // Use main light background
          zIndex: 10010, // Ensure it's above the FAB and other content
          display: 'flex',
          flexDirection: 'column', // Stack header, messages, input vertically
          overflow: 'hidden', // Prevent the container itself from scrolling
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            background: '#232323', // Dark header background
            color: '#fff',
            padding: '13px 0 11px',
            textAlign: 'center',
            fontWeight: 800,
            fontSize: 19,
            position: 'relative', // Needed for absolute positioning of close button
            zIndex: 2, // Keep header above scrolling content
            flexShrink: 0, // Prevent header from shrinking
          }}
        >
          Nema {/* Chat Title */}
          {/* Close Button */}
          <button
            onClick={() => setMobileOpen(false)} // Close the chat on click
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)', // Vertically center
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 26, // Large icon size
              fontWeight: 700,
              cursor: 'pointer',
              padding: '0 5px', // Increase tap area slightly
            }}
            aria-label="Cerrar chat" // Accessibility
          >
            × {/* Times symbol for close */}
          </button>
        </div>

        {/* Messages Area (Scrollable) */}
        <div
          ref={chatContainerRef} // Ref for scrolling control
          style={{
            flex: 1, // Take up all available vertical space
            overflowY: 'auto', // Enable vertical scrolling *only* for this area
            padding: '18px 8px 10px 8px', // Padding around messages
            scrollBehavior: 'smooth', // Use smooth scrolling for bot replies
            WebkitOverflowScrolling: 'touch', // Enable momentum scrolling on iOS
            background: 'var(--bg-light, #fffaf3)', // Match main background
          }}
        >
          {/* Render all messages */}
          {messages.map(renderMessage)}
          {/* Render thinking indicator if loading */}
          {loading && renderMessage({ thinking: true }, 'thinking')}
          {/* Empty div used as the target for scrolling to the bottom */}
          <div ref={messagesEndRef} style={{ height: '1px' }} />
        </div>

        {/* Input Form Area (Sticks to Bottom) */}
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input); }} // Handle form submission
          style={{
            padding: '10px 8px 10px 8px', // Padding around input/button
            background: 'var(--card-bg, #faf9f6)', // Slightly different background for input area
            borderTop: '1px solid #eee', // Separator line
            display: 'flex', // Use flexbox for input and button alignment
            alignItems: 'center', // Vertically align items
            gap: '8px', // Space between input field and button
            flexShrink: 0, // Prevent form area from shrinking
            position: 'sticky', // Stick to the bottom of the flex container
            bottom: 0, // Position at the bottom
            zIndex: 2, // Keep input area above messages during scroll overlap
          }}
        >
          {/* Input Field Wrapper (for character counter positioning) */}
          <div style={{ position: 'relative', flex: 1 }}> {/* Takes up remaining space */}
            <input
              ref={inputRef} // Ref for focusing
              type="text"
              value={input}
              onChange={e => {
                // Limit input length client-side
                if (e.target.value.length <= 150) setInput(e.target.value);
              }}
              onKeyDown={handleKeyDown} // Handle Enter key
              disabled={loading} // Disable input while waiting for response
              maxLength={150} // HTML5 max length attribute
              placeholder="¿A qué te dedicas?" // Placeholder text
              style={{
                fontFamily: 'Manifold, var(--font-main)',
                fontSize: 17, // Slightly smaller font for mobile input
                padding: '10px 45px 10px 14px', // Padding: R allows space for counter
                background: '#fff', // White background for input
                boxShadow: 'none',
                outline: 'none',
                width: '100%', // Fill wrapper width
                borderRadius: 20, // Rounded corners
                border: '1.5px solid #e0e0e0', // Subtle border
                boxSizing: 'border-box', // Include padding/border in width
                appearance: 'none', // Remove default mobile styling
              }}
            />
            {/* Character Counter */}
            <span style={{
              position: 'absolute',
              right: 10, // Position inside the input's right padding
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 11, // Small font size for counter
              color: input.length >= 150 ? '#d32f2f' : '#aaa', // Red when near limit, gray otherwise
              fontFamily: 'Manifold, var(--font-main)',
              background: 'rgba(255,255,255,0.6)', // Semi-transparent background
              borderRadius: 8,
              padding: '1px 4px',
              pointerEvents: 'none', // Doesn't interfere with typing
              zIndex: 1, // Above the input field itself
              minWidth: '30px',
              textAlign: 'center',
            }}>
              {input.length}/150 {/* Display current length / max length */}
            </span>
          </div>
          {/* Submit Button */}
          <button
            type="submit" // HTML5 submit button
            style={{
              height: 40, // Match input height visually
              minWidth: 50, // Ensure button has minimum width
              fontWeight: 700,
              fontSize: 16,
              borderRadius: 20, // Match input rounding
              background: '#232323', // Dark background
              color: '#fff', // White icon/text
              border: 'none',
              cursor: loading ? 'wait' : 'pointer', // Indicate loading state
              padding: '0 12px', // Padding inside button
              flexShrink: 0, // Prevent button from shrinking
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={loading} // Disable button when loading
            aria-label="Enviar mensaje" // Accessibility
          >
             {/* Send Icon (SVG) */}
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    );
  }

  // 3. Render Desktop Chat Widget View (default case)
  return (
    <div style={{
      background: 'var(--bg-light, #fffaf3)', // Main widget background
      borderRadius: 18, // Consistent rounding
      boxShadow: '0 2px 24px 0 rgba(34,34,34,0.07)', // Widget shadow
      width: '100%', // Take full width of its container (e.g., sima-placeholder)
      minHeight: 320, // Minimum height
      maxHeight: '70vh', // Maximum height to prevent excessive growth on tall screens
      display: 'flex',
      flexDirection: 'column', // Stack messages and input vertically
      overflow: 'hidden', // Container clips content, internal div scrolls
    }}>
      {/* Messages Area (Scrollable) */}
      <div
        ref={chatContainerRef} // Ref for scrolling
        style={{
          flex: 1, // Takes up available space
          overflowY: 'auto', // Enable vertical scrolling *only* here
          padding: '24px 16px 12px 16px', // Padding for messages
          background: 'var(--bg-light, #fffaf3)', // Match container background
          scrollBehavior: 'smooth', // Smooth scroll for bot messages
        }}
      >
        {messages.map(renderMessage)}
        {loading && renderMessage({ thinking: true }, 'thinking')}
        {/* Scroll target */}
        <div ref={messagesEndRef} style={{ height: '1px' }}/>
      </div>

      {/* Input Form Area */}
      <form
        onSubmit={e => { e.preventDefault(); sendMessage(input); }} // Handle submission
        style={{
          display: 'flex', // Use flex for alignment (although only one main child here)
          alignItems: 'center', // Vertically center content if needed
          padding: '10px 16px 14px 16px', // Padding around input area
          background: 'var(--card-bg, #faf9f6)', // Slightly different background for input area
          borderTop: '1px solid #eee', // Separator line
          flexShrink: 0, // Prevent this area from shrinking
          position: 'relative', // Needed for absolute positioning of button/counter
          zIndex: 1, // Ensure it's visually above scrolled content if overlap occurs
        }}
      >
        {/* Input field wrapper (takes most space) */}
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={inputRef} // Ref for focusing
            type="text"
            value={input}
            onChange={e => {
              if (e.target.value.length <= 150) setInput(e.target.value);
            }}
            onKeyDown={handleKeyDown} // Handle Enter key
            disabled={loading} // Disable while loading
            maxLength={150} // Max length
            placeholder="¿A qué te dedicas?" // Placeholder
            style={{
              fontFamily: 'Manifold, var(--font-main)',
              fontSize: 18, // Larger font size for desktop
              padding: '12px 120px 12px 18px', // Padding: R allows space for counter and button
              background: '#fff', // White input background
              boxShadow: 'none',
              outline: 'none', // Remove default focus outline
              width: '100%', // Fill the wrapper
              borderRadius: 24, // Rounded corners
              border: '1.5px solid #e0e0e0', // Subtle border
              boxSizing: 'border-box', // Include padding/border in width calculation
            }}
          />
          {/* Character Counter */}
          <span style={{
            position: 'absolute',
            right: 85, // Position left of the button area
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 13, // Slightly larger counter for desktop
            color: input.length >= 150 ? '#d32f2f' : '#aaa', // Red near limit, gray otherwise
            fontFamily: 'Manifold, var(--font-main)',
            background: 'rgba(255,255,255,0.6)',
            borderRadius: 10,
            padding: '2px 6px',
            pointerEvents: 'none',
            zIndex: 1, // Above input text
            minWidth: '35px',
            textAlign: 'center',
          }}>
            {input.length}/150
          </span>
          {/* Send Button */}
           <button
            type="submit" // Submit button
            style={{
              position: 'absolute', // Position absolutely within the form
              right: 6, // Position near the right edge
              top: '50%',
              transform: 'translateY(-50%)', // Vertically center
              height: 38, // Button height
              minWidth: 70, // Minimum width for the text
              fontWeight: 700,
              fontSize: 17,
              borderRadius: 20, // Rounded corners matching input less
              background: '#232323', // Dark background
              color: '#fff', // White text
              border: 'none',
              cursor: loading ? 'wait' : 'pointer', // Indicate loading state
              padding: '0 15px', // Padding inside button
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={loading} // Disable when loading
            aria-label="Enviar mensaje" // Accessibility
          >
            Enviar {/* Button Text */}
          </button>
        </div>
      </form>
    </div>
  );
}