import React from 'react';

// Puedes importar aquí el logo si tienes un componente o imagen, por ejemplo:
// import Logo from './Logo';

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '18px 24px 10px 18px',
  borderBottom: '1.5px solid #f3ede2',
  background: 'var(--bg-light, #fffaf3)',
  fontFamily: 'Manifold, var(--font-main)',
  position: 'sticky',
  top: 0,
  zIndex: 10,
};
const logoStyle = {
  height: 38,
  marginRight: 18,
};
const backBtnStyle = {
  marginLeft: 'auto',
  padding: '9px 22px',
  background: '#232323',
  color: '#fff',
  border: 'none',
  borderRadius: 20,
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
  fontFamily: 'Manifold, var(--font-main)',
};

const sectionStyle = {
  padding: '38px 24px 0 24px',
  fontFamily: 'Manifold, var(--font-main)',
  color: '#232323',
  maxWidth: 700,
  margin: '0 auto',
};
const h1Style = {
  fontSize: 32,
  fontWeight: 800,
  marginBottom: 18,
  letterSpacing: '-1px',
  color: 'var(--primary, #e26a2c)',
  fontFamily: 'Manifold, var(--font-main)',
};
const pStyle = {
  fontSize: 20,
  lineHeight: 1.45,
  color: '#232323',
  marginBottom: 0,
};

export default function CasoUsoPedidosCitas({ onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light, #fffaf3)' }}>
      {/* Cabecera */}
      <header style={headerStyle}>
        {/* Si tienes un componente Logo, reemplaza el siguiente img por <Logo /> */}
        <img src="/logo.png" alt="Logo" style={logoStyle} />
        <button style={backBtnStyle} onClick={onBack}>Volver</button>
      </header>
      {/* Sección 1 */}
      <section style={sectionStyle}>
        <h1 style={h1Style}>Tu Negocio Abierto 24/7: Un Agente Virtual para Pedidos y Citas.</h1>
        <p style={pStyle}>
          La gestión manual de pedidos, reservas o citas por teléfono, WhatsApp o redes sociales puede ser un verdadero desafío. Llamadas perdidas, errores al transcribir, personal atado al teléfono... todo esto resta eficiencia y te hace perder oportunidades. Imagina un sistema donde un agente virtual inteligente atiende y gestiona estas solicitudes automáticamente, liberando a tu equipo, y donde tú tienes una vista clara de todo en un dashboard centralizado. En este caso de uso, te mostramos cómo implementamos con éxito esta solución en una pizzería, demostrando su potencia y flexibilidad para gestionar cualquier tipo de solicitud en cualquier negocio de servicios, desde restaurantes hasta clínicas.
        </p>
      </section>
    </div>
  );
}
