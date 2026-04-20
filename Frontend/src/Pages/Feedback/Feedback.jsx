import React, { useState } from "react";
import "./Feedback.css";
import { useUser } from "../../util/UserContext";
import axios from "axios";
import Spinner from "react-bootstrap/Spinner";
import { toast } from "react-toastify";
import { notifySessionExpired } from "../../util/sessionToast";

const Feedback = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    feedbackType: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!formData.feedbackType) {
      toast.error("Please select a feedback type");
      return;
    }
    if (!formData.message.trim()) {
      toast.error("Please enter your feedback message");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post("/feedback/create", {
        rating,
        feedbackType: formData.feedbackType,
        message: formData.message,
      });
      toast.success(data.message);
      setRating(0);
      setFormData({ feedbackType: "", message: "" });
    } catch (error) {
      console.error(error);
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
        if (error.response.data.message === "Please Login") {
          notifySessionExpired();
          return;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-container">
      <h1>Share Your Feedback</h1>
      <p className="feedback-subtitle">
        Help us improve SkillXChange by sharing your thoughts and suggestions.
      </p>
      <div className="feedback-box">
        <form onSubmit={handleSubmit}>
          <div className="feedback-group">
            <label className="feedback-label">How would you rate your experience?</label>
            <div className="feedback-stars">
              {[1, 2, 3, 4, 5].map((value) => (
                <span
                  key={value}
                  className={`feedback-star ${value <= (hoverRating || rating) ? "filled" : ""}`}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </span>
              ))}
              {rating > 0 && <span className="rating-text">{rating}/5</span>}
            </div>
          </div>

          <div className="feedback-group">
            <label className="feedback-label" htmlFor="feedbackType">
              Feedback Type
            </label>
            <select
              id="feedbackType"
              name="feedbackType"
              className="feedback-select"
              value={formData.feedbackType}
              onChange={handleChange}
            >
              <option value="">Select feedback type...</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Suggestion">Feature Suggestion</option>
              <option value="UI/UX Issue">UI/UX Issue</option>
              <option value="General Feedback">General Feedback</option>
            </select>
          </div>

          <div className="feedback-group">
            <label className="feedback-label" htmlFor="message">
              Your Message
            </label>
            <textarea
              id="message"
              name="message"
              className="feedback-textarea"
              placeholder="Tell us what you think..."
              value={formData.message}
              onChange={handleChange}
              rows={5}
            />
          </div>

          <button type="submit" className="feedback-submit-btn" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : "Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
