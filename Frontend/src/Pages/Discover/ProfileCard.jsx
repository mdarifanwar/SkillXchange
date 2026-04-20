import React from "react";
import Card from "react-bootstrap/Card";
import "./Card.css";
import { Link } from "react-router-dom";
import { FiStar, FiArrowRight } from "react-icons/fi";

const ProfileCard = ({ profileImageUrl, bio, name, skills, rating, username }) => {
  const defaultAvatar =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='48' fill='%23F6EFC8'/%3E%3Cpath d='M48 50c9.94 0 18-8.06 18-18S57.94 14 48 14 30 22.06 30 32s8.06 18 18 18zm0 6c-13.25 0-24 10.75-24 24h48c0-13.25-10.75-24-24-24z' fill='%239C7A2F'/%3E%3C/svg%3E";

  const avatarSrc = profileImageUrl || defaultAvatar;

  return (
    <div className="card-container">
      <div className="card-top">
        <img
          className="img-container"
          src={avatarSrc}
          alt="user"
          onError={(event) => {
            event.currentTarget.src = defaultAvatar;
          }}
        />
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
