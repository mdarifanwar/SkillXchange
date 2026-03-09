import React from "react";

const Logo = ({ width = 320 }) => {
  return (
    <img
      src="/SkillXchange.svg"
      alt="SkillXchange"
      style={{ width, height: 'auto', display: 'inline-block' }}
    />
  );
};

export default Logo;
