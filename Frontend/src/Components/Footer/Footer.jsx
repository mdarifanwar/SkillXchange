import React from "react";

const Footer = () => {
  return (
    <footer
      className="w-100 d-flex justify-content-center align-items-center"
      style={{
        minHeight: "48px",
        padding: "10px 16px",
        background: "transparent",
        borderTop: "1px solid var(--border-light)",
      }}
    >
      <div
        className="text-center"
        style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", opacity: 0.9 }}
      >
        Copyright &copy; 2024 SkillXchange. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
