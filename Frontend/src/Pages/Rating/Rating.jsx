import React, { useState } from "react";
import "./Rating.css"; // Assuming your CSS styles are defined in styles.css
import axios from "axios";
import { toast } from "react-toastify";
import { useUser } from "../../util/UserContext";
import { useParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { notifySessionExpired } from "../../util/sessionToast";

const Rating = () => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const { user } = useUser();
  const { username } = useParams();
  const [loading, setLoading] = useState(false);

  const handleStarClick = (starValue) => {
    setRating(starValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle form submission here, e.g., sending data to a server
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (review.trim() === "") {
      toast.error("Please enter a review");
      return;
    }
    // Assuming you have a backend API endpoint to handle the form data
    try {
      setLoading(true);
      const { data } = await axios.post(`/rating/rateUser`, {
        rating: rating,
        description: review,
        username: username,
      });
      toast.success(data.message);
      setRating(0);
      setReview("");
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
    <div className="rating-form-container">
      <div className="inner-container">
        <h2>Give a Rating</h2>
        <form onSubmit={handleSubmit}>
          <div className="rating-review">
            <div className="star-rating">
              <p className="rating-label">Rate stars out of 5:</p>
              {[1, 2, 3, 4, 5].map((value) => (
                <span
                  key={value}
                  className={value <= rating ? "star filled" : "star"}
                  onClick={() => handleStarClick(value)}
                >
                  ★
                </span>
              ))}
            </div>
            <textarea
              placeholder="Write a review..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="review-input"
            ></textarea>
            <button type="submit" className="submit-button">
              {loading ? <Spinner animation="border" variant="primary" /> : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Rating;
