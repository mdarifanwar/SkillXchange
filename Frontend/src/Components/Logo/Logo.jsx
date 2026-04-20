import React from "react";

const Logo = ({ width = 320 }) => {
  const fontSize = Math.max(width * 0.14, 18);
  return (
    <span style={{
      fontFamily: "'Poppins', sans-serif",
      fontWeight: 700,
      fontSize,
      color: 'var(--logo-text-color, #1B2040)',
      letterSpacing: '-0.3px',
      lineHeight: 1.4,
      userSelect: 'none',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      overflow: 'visible',
    }}>
      skill
      <span style={{
        fontStyle: 'italic',
        fontWeight: 800,
        fontSize: fontSize * 1.2,
        color: '#E8461E',
        letterSpacing: '0px',
        lineHeight: 'inherit',
        verticalAlign: 'baseline',
      }}>X</span>
      change
    </span>
  );
};

export default Logo;
