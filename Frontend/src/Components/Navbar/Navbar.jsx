import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaMoon, FaSun } from "react-icons/fa";
import { FiUser, FiLogOut, FiMessageSquare } from "react-icons/fi";
import { MdAdminPanelSettings } from "react-icons/md";
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
  const profileRef = useRef(null);

  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === "admin";
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Fetch unread feedback count for admin
  useEffect(() => {
    if (isAdmin) {
      axios
        .get("/feedback/unread-count", { withCredentials: true })
        .then((res) => setUnreadFeedbackCount(res.data?.data?.count || 0))
        .catch(() => {});
    }
  }, [isAdmin]);

  // Close profile dropdown on route change
  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const navLinkClass = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;

  const displayUsername = useMemo(
    () => user?.username || JSON.parse(localStorage.getItem("userInfo") || "null")?.username,
    [user]
  );

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

  return (
    <header className="app-navbar-wrap">
      <nav className="fixed top-0 left-0 w-full border-b shadow-sm z-50 custom-navbar navbar navbar-expand-lg" style={{ overflow: 'visible' }}>
        <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between px-3 px-md-4" style={{ minHeight: '64px', overflow: 'visible' }}>
          <Link to="/" className="navbar-brand custom-brand fw-bold">
            Skill<span style={{ color: '#E8461E', fontWeight: 800, fontStyle: 'italic' }}>X</span>change
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse justify-content-end ${mobileOpen ? "show" : ""}`}>
            <ul className="navbar-nav mb-2 mb-lg-0 align-items-lg-center gap-lg-2 me-lg-3">
              <li className="nav-item">
                <NavLink to="/" className={navLinkClass} onClick={() => { setMobileOpen(false); setProfileOpen(false); }}>
                  Home
                </NavLink>
              </li>

              {isLoggedIn ? (
                <>
                  <li className="nav-item">
                    <NavLink to="/discover" className={navLinkClass} onClick={() => { setMobileOpen(false); setProfileOpen(false); }}>
                      Discover
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink to="/chats" className={navLinkClass} onClick={() => { setMobileOpen(false); setProfileOpen(false); }}>
                      Chats
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink to="/feedback" className={navLinkClass} onClick={() => { setMobileOpen(false); setProfileOpen(false); }}>
                      Feedback
                    </NavLink>
                  </li>
                  {isAdmin && (
                    <li className="nav-item">
                      <NavLink to="/admin/feedback" className={navLinkClass} onClick={() => { setMobileOpen(false); setProfileOpen(false); }}>
                        <span className="admin-nav-link">
                          Admin
                          {unreadFeedbackCount > 0 && (
                            <span className="nav-badge">{unreadFeedbackCount}</span>
                          )}
                        </span>
                      </NavLink>
                    </li>
                  )}
                </>
              ) : (
                <li className="nav-item">
                  <NavLink to="/about_us" className={navLinkClass} onClick={() => { setMobileOpen(false); setProfileOpen(false); }}>
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
                <div className="position-relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((prev) => !prev)}
                    className="avatar-btn"
                  >
                    <img
                      src={user?.picture || "https://via.placeholder.com/150"}
                      alt="Avatar"
                      className="avatar-img"
                    />
                  </button>

                  {profileOpen && (
                    <>
                      <div className="profile-menu-overlay" onClick={() => setProfileOpen(false)} />
                      <div className="profile-menu">
                        <div className="profile-menu-handle"></div>
                        <div className="profile-menu-header">
                          <img src={user?.picture || "https://via.placeholder.com/150"} alt="" className="profile-menu-avatar" />
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
                    </>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
                className="btn btn-outline-secondary theme-toggle-btn"
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
