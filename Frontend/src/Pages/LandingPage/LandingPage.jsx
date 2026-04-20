import React from "react";
import { useNavigate } from "react-router-dom";
import { FaGraduationCap, FaChalkboardTeacher } from "react-icons/fa";
import { useUser } from "../../util/UserContext";
import "./LandingPage.css";

const HeroTitle = () => (
  <h1 className="hero-title">
    <span className="hero-title-text">skill</span>
    <span className="hero-title-x">X</span>
    <span className="hero-title-text">change</span>
  </h1>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
    <div className="landing-page">
      <section className="hero-section">
        {/* Abstract background layer */}
        <div className="hero-bg-layer">
          {/* Dotted pattern */}
          <svg className="hero-dots" width="200" height="200" viewBox="0 0 200 200" fill="none">
            {Array.from({ length: 8 }).map((_, r) =>
              Array.from({ length: 8 }).map((_, c) => (
                <circle key={`${r}-${c}`} cx={14 + c * 26} cy={14 + r * 26} r="2" fill="currentColor" opacity="0.15" />
              ))
            )}
          </svg>
          <svg className="hero-dots hero-dots-br" width="160" height="160" viewBox="0 0 160 160" fill="none">
            {Array.from({ length: 6 }).map((_, r) =>
              Array.from({ length: 6 }).map((_, c) => (
                <circle key={`${r}-${c}`} cx={14 + c * 26} cy={14 + r * 26} r="2" fill="currentColor" opacity="0.12" />
              ))
            )}
          </svg>

          {/* Geometric shapes */}
          <div className="hero-shape hero-shape-1" />
          <div className="hero-shape hero-shape-2" />
          <div className="hero-shape hero-shape-3" />

          {/* City skyline silhouette */}
          <svg className="hero-skyline" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,120 L0,95 L40,95 L40,75 L55,75 L55,60 L70,60 L70,80 L90,80 L90,50 L100,50 L100,45 L110,45 L110,50 L120,50 L120,70 L150,70 L150,55 L160,55 L160,40 L175,40 L175,55 L185,55 L185,70 L200,70 L200,85 L240,85 L240,65 L260,65 L260,45 L270,45 L270,35 L280,35 L280,45 L295,45 L295,60 L320,60 L320,75 L360,75 L360,55 L380,55 L380,30 L395,30 L395,55 L410,55 L410,70 L440,70 L440,80 L500,80 L500,60 L520,60 L520,40 L530,40 L530,25 L540,25 L540,40 L555,40 L555,55 L580,55 L580,75 L620,75 L620,65 L650,65 L650,50 L665,50 L665,35 L675,35 L675,50 L690,50 L690,65 L720,65 L720,80 L780,80 L780,60 L800,60 L800,45 L810,45 L810,30 L825,30 L825,45 L840,45 L840,60 L870,60 L870,75 L920,75 L920,55 L940,55 L940,40 L955,40 L955,55 L975,55 L975,70 L1020,70 L1020,80 L1060,80 L1060,65 L1080,65 L1080,45 L1095,45 L1095,30 L1105,30 L1105,45 L1120,45 L1120,60 L1160,60 L1160,75 L1200,75 L1200,85 L1260,85 L1260,70 L1280,70 L1280,50 L1295,50 L1295,35 L1310,35 L1310,50 L1330,50 L1330,70 L1380,70 L1380,85 L1440,85 L1440,120 Z" fill="currentColor" opacity="0.04" />
          </svg>

          {/* Gradient wave */}
          <svg className="hero-wave" viewBox="0 0 1440 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heroWaveGrad" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#9B30FF" stopOpacity="0.18" />
                <stop offset="50%" stopColor="#E84A6F" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#FF7B2E" stopOpacity="0.18" />
              </linearGradient>
            </defs>
            <path d="M0,160 C240,100 480,180 720,130 C960,80 1200,160 1440,120 L1440,200 L0,200Z" fill="url(#heroWaveGrad)" />
            <path d="M0,180 C360,130 720,200 1080,150 C1260,130 1380,160 1440,155 L1440,200 L0,200Z" fill="url(#heroWaveGrad)" opacity="0.6" />
          </svg>
        </div>

        <div className="hero-content">
          <HeroTitle />
          <p className="hero-tagline">Learn &bull; Grow &bull; Transform</p>
          <p className="hero-subtitle">
            Connect, Collaborate, and Grow. The ultimate platform to exchange skills and master new technologies.
          </p>
          <div className="hero-buttons">
            <button
              className="btn-primary"
              onClick={() =>
                navigate(
                  user?.username ? `/profile/${user.username}` : "/login"
                )
              }
            >
              Get Started
            </button>
            <button className="btn-outline" onClick={() => document.getElementById("features").scrollIntoView({ behavior: "smooth" })}>
              Learn More
            </button>
          </div>
        </div>
      </section>

      <section id="features" className="section features-section container">
        <h2 className="section-title">WHY SKILLXCHANGE?</h2>
        
        <div className="features-grid">
          <FeatureCard 
            icon={<FaGraduationCap />}
            title="Learn From Experts"
            description="Gain insights and practical knowledge directly from experienced mentors who excel in their respective fields."
          />
          <FeatureCard 
            icon={<FaChalkboardTeacher />}
            title="Share Your Expertise"
            description="Have a skill or passion you're eager to share? SkillXchange provides a platform for you for oneself."
          />
        </div>
      </section>
    </div>
  );
};


const FeatureCard = ({ title, description, icon }) => (
  <div className="card feature-card">
    <div className="feature-icon-wrapper" style={{color: 'var(--accent-blue)', marginBottom: '1rem', fontSize: '1.5rem'}}>
        {icon}
    </div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-desc">{description}</p>
  </div>
);

export default LandingPage;
