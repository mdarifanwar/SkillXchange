import { useEffect, useMemo, useRef, useState } from "react";
import Logo from "../Logo/Logo";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaMoon, FaSun } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { FiUser, FiLogOut } from "react-icons/fi";
import axios from "axios";
import { useUser } from "../../util/UserContext";
import "./Navbar.css";

const Header = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const avatarBtnRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileToggleRef = useRef(null);

  const isLoggedIn = Boolean(user);
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!profileOpen) return;
      const menuEl = profileMenuRef.current;
      const avatarEl = avatarBtnRef.current;
      if (menuEl && menuEl.contains(event.target)) return;
      if (avatarEl && avatarEl.contains(event.target)) return;
      setProfileOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [profileOpen]);

  useEffect(() => {
    const handleMobileOutsideClick = (event) => {
      if (!mobileOpen) return;
      const menuEl = mobileMenuRef.current;
      const toggleEl = mobileToggleRef.current;
      if (menuEl && menuEl.contains(event.target)) return;
      if (toggleEl && toggleEl.contains(event.target)) return;
      setMobileOpen(false);
    };

    document.addEventListener("mousedown", handleMobileOutsideClick);
    return () => document.removeEventListener("mousedown", handleMobileOutsideClick);
  }, [mobileOpen]);

  const navLinkClass = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;

  const displayUsername = useMemo(() => {
    if (user?.username) return user.username;
    const rawUserInfo = localStorage.getItem("userInfo");
    if (!rawUserInfo || rawUserInfo === "undefined") return null;

    try {
      return JSON.parse(rawUserInfo)?.username || null;
    } catch (error) {
      console.warn("Invalid userInfo in localStorage", error);
      return null;
    }
  }, [user]);

  const displayPicture = useMemo(() => {
    if (user?.picture) return user.picture;
    const rawUserInfo = localStorage.getItem("userInfo");
    if (!rawUserInfo || rawUserInfo === "undefined") return null;

    try {
      return JSON.parse(rawUserInfo)?.picture || null;
    } catch (error) {
      console.warn("Invalid userInfo in localStorage", error);
      return null;
    }
  }, [user]);

  const defaultAvatar =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='40' fill='%23F6EFC8'/%3E%3Cpath d='M40 42c8.284 0 15-6.716 15-15S48.284 12 40 12 25 18.716 25 27s6.716 15 15 15zm0 6c-11.046 0-20 8.954-20 20h40c0-11.046-8.954-20-20-20z' fill='%239C7A2F'/%3E%3C/svg%3E";

  const getAvatarSrc = (picture) => picture || defaultAvatar;

  const handleLogout = async () => {
    localStorage.removeItem("userInfo");
    setUser(null);
    setProfileOpen(false);

    try {
      await axios.get("/auth/logout");
    } finally {
      navigate("/login");
    }
  };

  const goToProfile = () => {
    if (!displayUsername) return;
    setProfileOpen(false);
    navigate(`/profile/${displayUsername}`);
  };

  const handleBack = () => {
    setMobileOpen(false);
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  return (
    <header className="app-navbar-wrap">
      <nav className="fixed top-0 left-0 w-full border-b shadow-sm z-50 custom-navbar navbar navbar-expand-lg" style={{ overflow: 'visible' }}>
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-6" style={{ minHeight: '64px', overflow: 'visible' }}>
          <div className="navbar-left">
            {!isHomePage && (
              <button
                type="button"
                className="mobile-back-btn"
                onClick={handleBack}
                aria-label="Go back"
              >
                <FiArrowLeft />
              </button>
            )}
            <Link to="/" className="navbar-brand custom-brand fw-bold">
              <Logo width={180} />
            </Link>
          </div>

          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation"
            ref={mobileToggleRef}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className={`collapse navbar-collapse justify-content-end ${mobileOpen ? "show" : ""}`}
            ref={mobileMenuRef}
          >
            <ul className="navbar-nav mb-2 mb-lg-0 align-items-lg-center gap-lg-2 me-lg-3">
              <li className="nav-item">
                <NavLink to="/" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                  Home
                </NavLink>
              </li>

              {isLoggedIn ? (
                <>
                  <li className="nav-item">
                    <NavLink to="/discover" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                      Discover
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink to="/chats" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                      Chats
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink to="/feedback" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                      Feedback
                    </NavLink>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  <NavLink to="/about_us" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                    About Us
                  </NavLink>
                </li>
              )}
            </ul>

            <div className="d-flex align-items-center gap-2 position-relative navbar-actions">
              {!isLoggedIn && (
                <NavLink
                  to="/login"
                  className="btn btn-primary px-3"
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </NavLink>
              )}

              {isLoggedIn && (
                <div className="position-relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((prev) => !prev)}
                    className="avatar-btn"
                    ref={avatarBtnRef}
                  >
                    <img
                      src={getAvatarSrc(displayPicture)}
                      alt="Avatar"
                      className="avatar-img"
                      onError={(event) => {
                        event.currentTarget.src = defaultAvatar;
                      }}
                    />
                  </button>

                  {profileOpen && (
                    <div className="profile-menu-sheet" ref={profileMenuRef}>
                      <div className="profile-menu-backdrop" onClick={() => setProfileOpen(false)} />
                      <div className="profile-menu">
                      <div className="profile-menu-header">
                        <img
                          src={getAvatarSrc(displayPicture)}
                          alt=""
                          className="profile-menu-avatar"
                          onError={(event) => {
                            event.currentTarget.src = defaultAvatar;
                          }}
                        />
                        <div>
                          <p className="profile-menu-name">{user?.name || "User"}</p>
                          <p className="profile-menu-username">@{displayUsername}</p>
                        </div>
                      </div>
                      <div className="profile-menu-divider"></div>
                      <button type="button" onClick={goToProfile} className="profile-menu-item">
                        <FiUser className="profile-menu-icon" /> Profile
                      </button>
                      <div className="profile-menu-divider"></div>
                      <button type="button" onClick={handleLogout} className="profile-menu-item profile-menu-logout">
                        <FiLogOut className="profile-menu-icon" /> Logout
                      </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
                className="theme-toggle-btn"
                aria-label="Toggle Theme"
              >
                {theme === "light" ? <FaMoon /> : <FaSun />}
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
