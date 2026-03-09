import React, { useState, useEffect } from "react";
import "./AdminFeedback.css";
import { useUser } from "../../util/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Spinner from "react-bootstrap/Spinner";
import { toast } from "react-toastify";
import { notifySessionExpired } from "../../util/sessionToast";
import { FaTrash, FaStar, FaCheck, FaCheckDouble } from "react-icons/fa";

const AdminFeedback = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterType, setFilterType] = useState("All");

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchFeedbacks();
  }, [user]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/feedback/all", { withCredentials: true });
      setFeedbacks(data.data);
    } catch (error) {
      console.error(error);
      if (error?.response?.status === 401) {
        notifySessionExpired();
        navigate("/login");
      } else if (error?.response?.status === 403) {
        toast.error("Access denied. Admin only.");
        navigate("/");
      } else {
        toast.error("Failed to fetch feedbacks");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (feedbackId) => {
    try {
      await axios.put(`/feedback/mark-read/${feedbackId}`, {}, { withCredentials: true });
      setFeedbacks((prev) =>
        prev.map((f) => (f._id === feedbackId ? { ...f, isRead: true } : f))
      );
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put("/feedback/mark-all-read", {}, { withCredentials: true });
      setFeedbacks((prev) => prev.map((f) => ({ ...f, isRead: true })));
      toast.success("All feedbacks marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (feedbackId) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    try {
      await axios.delete(`/feedback/delete/${feedbackId}`, { withCredentials: true });
      setFeedbacks((prev) => prev.filter((f) => f._id !== feedbackId));
      toast.success("Feedback deleted");
    } catch (error) {
      toast.error("Failed to delete feedback");
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedFeedbacks = [...feedbacks]
    .filter((f) => filterType === "All" || f.feedbackType === filterType)
    .sort((a, b) => {
      let valA, valB;
      if (sortField === "createdAt") {
        valA = new Date(a.createdAt);
        valB = new Date(b.createdAt);
      } else if (sortField === "rating") {
        valA = a.rating;
        valB = b.rating;
      } else if (sortField === "feedbackType") {
        valA = a.feedbackType;
        valB = b.feedbackType;
      } else if (sortField === "user") {
        valA = a.user?.name || "";
        valB = b.user?.name || "";
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const unreadCount = feedbacks.filter((f) => !f.isRead).length;
  const sortArrow = (field) =>
    sortField === field ? (sortOrder === "asc" ? " ▲" : " ▼") : "";

  const renderStars = (count) =>
    Array.from({ length: 5 }, (_, i) => (
      <FaStar key={i} className={i < count ? "star-filled" : "star-empty"} />
    ));

  if (loading) {
    return (
      <div className="admin-feedback-container">
        <div className="admin-feedback-loading">
          <Spinner animation="border" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-feedback-container">
      <div className="admin-feedback-header">
        <div>
          <h1>Feedback Dashboard</h1>
          <p className="admin-feedback-stats">
            {feedbacks.length} total feedback{feedbacks.length !== 1 && "s"}
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} new</span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={handleMarkAllRead}>
            <FaCheckDouble /> Mark All Read
          </button>
        )}
      </div>

      <div className="admin-feedback-filters">
        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="All">All Types</option>
          <option value="Bug Report">Bug Report</option>
          <option value="Feature Suggestion">Feature Suggestion</option>
          <option value="UI/UX Issue">UI/UX Issue</option>
          <option value="General Feedback">General Feedback</option>
        </select>
      </div>

      {sortedFeedbacks.length === 0 ? (
        <div className="admin-feedback-empty">
          <p>No feedback found.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="admin-feedback-table-wrap">
            <table className="admin-feedback-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("user")} className="sortable">
                    User{sortArrow("user")}
                  </th>
                  <th onClick={() => handleSort("rating")} className="sortable">
                    Rating{sortArrow("rating")}
                  </th>
                  <th onClick={() => handleSort("feedbackType")} className="sortable">
                    Type{sortArrow("feedbackType")}
                  </th>
                  <th>Message</th>
                  <th onClick={() => handleSort("createdAt")} className="sortable">
                    Date{sortArrow("createdAt")}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedFeedbacks.map((fb) => (
                  <tr key={fb._id} className={!fb.isRead ? "unread-row" : ""}>
                    <td>
                      <div className="user-cell">
                        <img
                          src={fb.user?.picture || "https://via.placeholder.com/32"}
                          alt=""
                          className="user-avatar"
                        />
                        <div>
                          <span className="user-name">{fb.user?.name || "Deleted User"}</span>
                          <span className="user-username">@{fb.user?.username || "unknown"}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="stars-cell">{renderStars(fb.rating)}</div>
                    </td>
                    <td>
                      <span className={`type-badge type-${fb.feedbackType.replace(/[\s/]/g, "-").toLowerCase()}`}>
                        {fb.feedbackType}
                      </span>
                    </td>
                    <td>
                      <p className="message-cell">{fb.message}</p>
                    </td>
                    <td className="date-cell">
                      {new Date(fb.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td>
                      <div className="actions-cell">
                        {!fb.isRead && (
                          <button
                            className="action-btn read-btn"
                            onClick={() => handleMarkRead(fb._id)}
                            title="Mark as read"
                          >
                            <FaCheck />
                          </button>
                        )}
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(fb._id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="admin-feedback-cards">
            {sortedFeedbacks.map((fb) => (
              <div key={fb._id} className={`feedback-card ${!fb.isRead ? "unread-card" : ""}`}>
                <div className="card-header">
                  <div className="user-cell">
                    <img
                      src={fb.user?.picture || "https://via.placeholder.com/32"}
                      alt=""
                      className="user-avatar"
                    />
                    <div>
                      <span className="user-name">{fb.user?.name || "Deleted User"}</span>
                      <span className="user-username">@{fb.user?.username || "unknown"}</span>
                    </div>
                  </div>
                  <div className="card-actions">
                    {!fb.isRead && (
                      <button
                        className="action-btn read-btn"
                        onClick={() => handleMarkRead(fb._id)}
                        title="Mark as read"
                      >
                        <FaCheck />
                      </button>
                    )}
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(fb._id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="card-meta">
                    <div className="stars-cell">{renderStars(fb.rating)}</div>
                    <span className={`type-badge type-${fb.feedbackType.replace(/[\s/]/g, "-").toLowerCase()}`}>
                      {fb.feedbackType}
                    </span>
                  </div>
                  <p className="message-cell">{fb.message}</p>
                  <span className="card-date">
                    {new Date(fb.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminFeedback;
