import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import axios from "axios";
import { toast } from "react-toastify";
import Nav from "react-bootstrap/Nav";
import Spinner from "react-bootstrap/Spinner";
import ProfileCard from "./ProfileCard";
import Footer from "../../Components/Footer/Footer";
import { notifySessionExpired } from "../../util/sessionToast";
import { FiSearch, FiUsers, FiCode, FiCpu, FiGrid, FiStar } from "react-icons/fi";
import "./Discover.css";

const EmptyState = ({ message, icon }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon || <FiSearch />}</div>
    <p className="empty-state-text">{message}</p>
    <p className="empty-state-sub">Try adjusting your skills or check back later</p>
  </div>
);

const Discover = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const [loading, setLoading] = useState(false);
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [webDevUsers, setWebDevUsers] = useState([]);
  const [mlUsers, setMlUsers] = useState([]);
  const [otherUsers, setOtherUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("for-you");

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/user/registered/getDetails`);
        setUser(data.data);
        localStorage.setItem("userInfo", JSON.stringify(data.data));
      } catch (error) {
        if (error?.response?.status === 401) {
          notifySessionExpired();
        }
      }
    };

    const getDiscoverUsers = async () => {
      try {
        const { data } = await axios.get("/user/discover");
        setDiscoverUsers(data.data.forYou || []);
        setWebDevUsers(data.data.webDev || []);
        setMlUsers(data.data.ml || []);
        setOtherUsers(data.data.others || []);
      } catch (error) {
        if (error?.response?.status === 401) {
          notifySessionExpired();
        } else {
          toast.error(error?.response?.data?.message || "Error fetching discover users");
        }
      } finally {
        setLoading(false);
      }
    };

    getUser();
    getDiscoverUsers();
  }, [navigate, setUser]);

  const filterUsers = (users) => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u?.name?.toLowerCase().includes(term) ||
        u?.skillsProficientAt?.some((s) => s.toLowerCase().includes(term))
    );
  };

  const totalUsers = discoverUsers.length + webDevUsers.length + mlUsers.length + otherUsers.length;

  const renderCards = (users, emptyMessage, icon) => {
    const filtered = filterUsers(users);
    return (
      <div className="profile-grid">
        {filtered.length > 0 ? (
          filtered.map((user) => (
            <ProfileCard
              key={user._id || user.username}
              profileImageUrl={user?.picture}
              name={user?.name}
              rating={user?.rating || 4}
              bio={user?.bio}
              skills={user?.skillsProficientAt}
              username={user?.username}
            />
          ))
        ) : (
          <EmptyState message={emptyMessage} icon={icon} />
        )}
      </div>
    );
  };

  const categories = [
    { id: "for-you", label: "For You", icon: <FiStar /> },
    { id: "popular", label: "Popular", icon: <FiUsers /> },
    { id: "web-development", label: "Web Development", icon: <FiCode /> },
    { id: "machine-learning", label: "Machine Learning", icon: <FiCpu /> },
    { id: "others", label: "Others", icon: <FiGrid /> },
  ];

  return (
    <div className="h-full flex overflow-hidden discover-shell">
      <aside className="discover-sidebar">
        <h5 className="categories-title">Categories</h5>
        <Nav className="flex-column sidebar-nav">
          {categories.map((cat) => (
            <Nav.Link
              key={cat.id}
              href={`#${cat.id}`}
              className={`sidebar-link ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="sidebar-link-icon">{cat.icon}</span>
              {cat.label}
            </Nav.Link>
          ))}
        </Nav>

        <div className="sidebar-stats">
          <div className="stat-item">
            <span className="stat-number">{totalUsers}</span>
            <span className="stat-label">Users Found</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto discover-content">
        {loading ? (
          <div className="loading-wrap">
            <Spinner animation="border" variant="primary" />
            <p className="loading-text">Finding people for you...</p>
          </div>
        ) : (
          <div className="discover-sections">
            {/* Hero Banner */}
            <div className="discover-hero">
              <div className="hero-text">
                <h1 className="hero-title">
                  Discover <span className="hero-accent">Talented</span> People
                </h1>
                <p className="hero-subtitle">
                  Connect with skilled professionals and exchange knowledge
                </p>
              </div>
              <div className="hero-search">
                <FiSearch className="hero-search-icon" />
                <input
                  type="text"
                  placeholder="Search by name or skill..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="hero-search-input"
                />
              </div>
            </div>

            <section id="for-you" className="discover-section">
              <div className="section-header-row">
                <div className="section-header-left">
                  <span className="section-icon"><FiStar /></span>
                  <h1 className="section-header">For You</h1>
                </div>
                <span className="section-count">{filterUsers(discoverUsers).length} users</span>
              </div>
              {renderCards(discoverUsers, "No recommended users found yet. Add more skills to get better matches!", <FiStar />)}
            </section>

            <section id="popular" className="discover-section">
              <div className="section-header-row">
                <div className="section-header-left">
                  <span className="section-icon"><FiUsers /></span>
                  <h1 className="section-header">Popular</h1>
                </div>
              </div>
            </section>

            <section id="web-development" className="discover-section">
              <div className="section-header-row">
                <div className="section-header-left">
                  <span className="section-icon"><FiCode /></span>
                  <h2 className="section-subheader">Web Development</h2>
                </div>
                <span className="section-count">{filterUsers(webDevUsers).length} users</span>
              </div>
              {renderCards(webDevUsers, "No Web Developers found.", <FiCode />)}
            </section>

            <section id="machine-learning" className="discover-section">
              <div className="section-header-row">
                <div className="section-header-left">
                  <span className="section-icon"><FiCpu /></span>
                  <h2 className="section-subheader">Machine Learning</h2>
                </div>
                <span className="section-count">{filterUsers(mlUsers).length} users</span>
              </div>
              {renderCards(mlUsers, "No Machine Learning users found.", <FiCpu />)}
            </section>

            <section id="others" className="discover-section">
              <div className="section-header-row">
                <div className="section-header-left">
                  <span className="section-icon"><FiGrid /></span>
                  <h2 className="section-subheader">Others</h2>
                </div>
                <span className="section-count">{filterUsers(otherUsers).length} users</span>
              </div>
              {renderCards(otherUsers, "No users to show.", <FiGrid />)}
            </section>

            <div className="discover-footer-wrap">
              <Footer />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Discover;
