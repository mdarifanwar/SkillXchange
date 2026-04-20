import React from "react";
import "./PremiumChatRequestModal.css";

const PremiumChatRequestModal = ({
  avatar = "https://via.placeholder.com/120",
  username = "Md Arif",
  rating = "New",
  skills = ["Azure"],
  onViewProfile,
  onReject,
  onAccept,
  loading = false,
}) => (
  <div className="glass-modal-overlay">
    <div className="glass-modal-card">
      <div className="modal-avatar">
        <img src={avatar} alt={username} />
      </div>
      <div className="modal-username">{username}</div>
      <div className="modal-rating">Rating : <span>{rating}</span></div>
      <button className="modal-view-profile" onClick={onViewProfile}>
        View Profile
      </button>
      <div className="modal-skills">
        <div className="skills-label">Skills</div>
        <div className="skills-list">
          {skills.map(skill => (
            <span className="skill-pill" key={skill}>{skill}</span>
          ))}
        </div>
      </div>
      <div className="modal-actions">
        <button className="modal-reject" onClick={onReject}>
          Reject
        </button>
        <button
          className="modal-accept"
          onClick={onAccept}
          disabled={loading}
        >
          {loading ? "Processing..." : "Accept Request"}
        </button>
      </div>
    </div>
  </div>
);

export default PremiumChatRequestModal;
