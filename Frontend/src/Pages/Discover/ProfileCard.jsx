import React from "react";
import Card from "react-bootstrap/Card";
import "./Card.css";
import { Link } from "react-router-dom";
import { FiStar, FiArrowRight } from "react-icons/fi";

const ProfileCard = ({ profileImageUrl, bio, name, skills, rating, username }) => {
  return (
    <div className="card-container">
      <div className="card-top">
        <img className="img-container" src={profileImageUrl} alt="user" />
        <h3 className="card-name">{name}</h3>
        <div className="card-rating">
          <FiStar className="rating-star" />
          <span>{rating}</span>
        </div>
        {bio && <p className="card-bio">{bio}</p>}
      </div>

      <div className="card-bottom">
        <div className="profskills">
          <span className="profskills-label">Skills</span>
          <div className="profskill-boxes">
            {skills && skills.length > 0 ? (
              skills.slice(0, 4).map((skill, index) => (
                <div key={index} className="profskill-box">
                  <span className="skill">{skill}</span>
                </div>
              ))
            ) : (
              <div className="profskill-box no-skill">
                <span className="skill">No skills listed</span>
              </div>
            )}
            {skills && skills.length > 4 && (
              <div className="profskill-box more-skills">
                <span className="skill">+{skills.length - 4}</span>
              </div>
            )}
          </div>
        </div>

        <div className="prof-buttons">
          <Link to={`/profile/${username}`} className="view-profile-link">
            <button className="btn-view-profile">
              View Profile <FiArrowRight className="btn-arrow" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
