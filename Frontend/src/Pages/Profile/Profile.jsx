import React, { useRef } from "react";
import "./Profile.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import { toast } from "react-toastify";
import axios from "axios";
import Spinner from "react-bootstrap/Spinner";
import { notifySessionExpired } from "../../util/sessionToast";
import { FiEdit2, FiFlag, FiStar, FiGithub, FiLinkedin, FiExternalLink, FiMessageCircle, FiBookOpen, FiBriefcase, FiAward, FiHeart, FiCalendar, FiCamera } from "react-icons/fi";

const Profile = () => {
  const defaultAvatar =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='60' fill='%23F6EFC8'/%3E%3Cpath d='M60 62c12.15 0 22-9.85 22-22S72.15 18 60 18 38 27.85 38 40s9.85 22 22 22zm0 8c-16.57 0-30 13.43-30 30h60c0-16.57-13.43-30-30-30z' fill='%239C7A2F'/%3E%3C/svg%3E";
  const { user, setUser } = useUser();
  const [profileUser, setProfileUser] = useState(null);
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      if (!username || username === "undefined" || username === "null") {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data } = await axios.get(`/user/registered/getDetails/${username}`);
        console.log(data.data);
        setProfileUser(data.data);
      } catch (error) {
        console.log(error);
        if (error?.response?.data?.message) {
          toast.error(error.response.data.message);
          if (
            error.response.data.message === "Please Login" ||
            error.response.data.message === "Token Expired, Please Login Again"
          ) {
            notifySessionExpired();
            return;
          }
        }
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  const convertDate = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const formattedDate = date.toLocaleDateString("en-US", { month: "2-digit", year: "numeric" }).replace("/", "-");
    return formattedDate;
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("coverImage", file);

    try {
      setCoverUploading(true);
      const { data } = await axios.post("/user/uploadCoverImage", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfileUser((prev) => ({ ...prev, coverImage: data.data.url }));
      toast.success("Cover image updated!");
    } catch (error) {
      console.log(error);
      const msg = error?.response?.data?.message;
      if (msg) {
        toast.error(msg);
        if (msg === "Please Login" || msg === "Token Expired, Please Login Again") {
          notifySessionExpired();
          return;
        }
      } else {
        toast.error("Failed to upload cover image");
      }
    } finally {
      setCoverUploading(false);
      e.target.value = "";
    }
  };

  const connectHandler = async () => {
    console.log("Connect");
    try {
      setConnectLoading(true);
      const { data } = await axios.post(`/request/create`, {
        receiverID: profileUser._id,
      });

      console.log(data);
      toast.success(data.message);
      setProfileUser((prevState) => {
        return {
          ...prevState,
          status: "Pending",
        };
      });
    } catch (error) {
      console.log(error);
      const backendMessage = error?.response?.data?.message;
      if (backendMessage) {
        toast.error(backendMessage);
        if (
          backendMessage === "Please Login" ||
          backendMessage === "Token Expired, Please Login Again"
        ) {
          notifySessionExpired();
          return;
        }
      } else {
        toast.error("Failed to send request");
      }
    } finally {
      setConnectLoading(false);
    }
  };

  const normalizeExternalUrl = (url) => {
    if (!url || typeof url !== "string") return null;
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return null;

    if (/^(javascript|data):/i.test(trimmedUrl)) return null;
    if (/^https?:\/\//i.test(trimmedUrl)) return trimmedUrl;
    if (/^\/\//.test(trimmedUrl)) return `https:${trimmedUrl}`;

    return `https://${trimmedUrl}`;
  };

  const githubUrl = normalizeExternalUrl(profileUser?.githubLink);
  const linkedinUrl = normalizeExternalUrl(profileUser?.linkedinLink);
  const portfolioUrl = normalizeExternalUrl(profileUser?.portfolioLink);
  const isOwnProfile = user && (user.username === username || (user.username && username && user.username.toLowerCase() === username.toLowerCase()));

  const skillCount = (profileUser?.skillsProficientAt?.length || 0) + (profileUser?.skillsInterestedIn?.length || 0);
  const projectCount = profileUser?.projects?.length || 0;

  return (
    <div className="profile-main-container">
        {loading ? (
          <div className="profile-loading">
            <Spinner animation="border" variant="primary" />
            <p>Loading profile...</p>
          </div>
        ) : !profileUser ? (
          <div className="profile-loading">
            <h2>User Not Found</h2>
          </div>
        ) : (
          <>
            {/* Cover Banner */}
            <div className="profile-cover" style={profileUser?.coverImage ? { backgroundImage: `url(${profileUser.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
              {!profileUser?.coverImage && <div className="cover-pattern"></div>}
              {isOwnProfile && (
                <>
                  <input
                    type="file"
                    ref={coverInputRef}
                    onChange={handleCoverImageUpload}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                  />
                  <button
                    className="cover-camera-btn"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={coverUploading}
                    title="Change cover photo"
                  >
                    {coverUploading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <FiCamera />
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Header Card */}
            <div className="profile-header-card">
              <div className="profile-avatar-wrapper">
                <img
                  src={profileUser?.picture || defaultAvatar}
                  alt="Profile"
                  className="profile-avatar-large"
                  onError={(event) => {
                    event.currentTarget.src = defaultAvatar;
                  }}
                />
                <div className="avatar-ring"></div>
              </div>

              <div className="profile-info">
                <div className="profile-name-row">
                  <div>
                    <h1>{profileUser?.name}</h1>
                    <p className="profile-username">@{profileUser?.username}</p>
                  </div>

                  <div className="profile-actions">
                    {isOwnProfile ? (
                      <button className="btn-outline" onClick={() => navigate("/edit_profile")}>
                        <FiEdit2 /> Edit Profile
                      </button>
                    ) : (
                      <>
                        <button
                          className="btn-primary"
                          onClick={connectHandler}
                          disabled={profileUser?.status === "Pending"}
                        >
                          {connectLoading ? (
                            <Spinner animation="border" variant="light" size="sm" />
                          ) : (
                            <>
                              <FiMessageCircle />
                              {profileUser?.status || "Connect"}
                            </>
                          )}
                        </button>
                        <button className="btn-outline" onClick={() => navigate(`/rating/${profileUser.username}`)}>
                          <FiStar /> Rate
                        </button>
                        <button className="btn-outline btn-outline-danger" onClick={() => navigate(`/report/${profileUser.username}`)}>
                          <FiFlag /> Report
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="profile-rating">
                  <div className="rating-stars-row">
                    {Array.from({ length: 5 }, (_, i) => (
                      <FiStar
                        key={i}
                        className={`star-icon ${i < (profileUser?.rating || 5) ? "star-filled" : ""}`}
                      />
                    ))}
                  </div>
                  <span className="rating-value">{profileUser?.rating || "5.0"}</span>
                </div>

                {/* Stats Row */}
                <div className="profile-stats-row">
                  <div className="profile-stat">
                    <FiAward className="stat-icon" />
                    <span className="stat-num">{skillCount}</span>
                    <span className="stat-lbl">Skills</span>
                  </div>
                  <div className="profile-stat">
                    <FiBriefcase className="stat-icon" />
                    <span className="stat-num">{projectCount}</span>
                    <span className="stat-lbl">Projects</span>
                  </div>
                  {(githubUrl || linkedinUrl || portfolioUrl) && (
                    <div className="profile-social-links">
                      {githubUrl && (
                        <a href={githubUrl} target="_blank" rel="noreferrer" className="social-icon" title="GitHub">
                          <FiGithub />
                        </a>
                      )}
                      {linkedinUrl && (
                        <a href={linkedinUrl} target="_blank" rel="noreferrer" className="social-icon" title="LinkedIn">
                          <FiLinkedin />
                        </a>
                      )}
                      {portfolioUrl && (
                        <a href={portfolioUrl} target="_blank" rel="noreferrer" className="social-icon" title="Portfolio">
                          <FiExternalLink />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Body Grid */}
            <div className="profile-body-grid">
              {/* Bio Card */}
              <div className="content-card bio-section">
                <div className="card-header-row">
                  <FiBookOpen className="card-header-icon" />
                  <h3>About</h3>
                </div>
                <p className="bio-text">{profileUser?.bio || "No bio available."}</p>
              </div>

              {/* Skills Card */}
              <div className="content-card skills-section">
                <div className="card-header-row">
                  <FiAward className="card-header-icon" />
                  <h3>Skills</h3>
                </div>
                <div className="skills-badge-list">
                  {profileUser?.skillsProficientAt && profileUser.skillsProficientAt.length > 0 ? (
                    profileUser.skillsProficientAt.map((skill, index) => (
                      <span key={index} className="skill-badge">{skill}</span>
                    ))
                  ) : (
                    <span className="no-data-text">No skills listed.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Interests */}
            {profileUser?.skillsInterestedIn && profileUser.skillsInterestedIn.length > 0 && (
              <div className="content-card full-width">
                <div className="card-header-row">
                  <FiHeart className="card-header-icon" />
                  <h3>Interests</h3>
                </div>
                <div className="skills-badge-list">
                  {profileUser.skillsInterestedIn.map((skill, index) => (
                    <span key={index} className="skill-badge interest">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profileUser?.education && profileUser?.education.length > 0 && (
              <div className="content-card full-width">
                <div className="card-header-row">
                  <FiBookOpen className="card-header-icon" />
                  <h3>Education</h3>
                </div>
                <div className="timeline-list">
                  {profileUser.education.map((edu, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <h4>{edu?.institution}</h4>
                        <span className="timeline-date">
                          <FiCalendar /> {convertDate(edu?.startDate)} — {convertDate(edu?.endDate)}
                        </span>
                        <p className="timeline-spec">{edu?.degree} {edu?.score ? `• ${edu?.score}%` : ''}</p>
                        {edu?.description && <p className="timeline-desc">{edu?.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {profileUser?.projects && profileUser?.projects.length > 0 && (
              <div className="content-card full-width">
                <div className="card-header-row">
                  <FiBriefcase className="card-header-icon" />
                  <h3>Projects</h3>
                </div>
                <div className="timeline-list">
                  {profileUser.projects.map((project, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <h4>{project?.title}</h4>
                        <span className="timeline-date">
                          <FiCalendar /> {convertDate(project?.startDate)} — {convertDate(project?.endDate)}
                        </span>
                        {project?.description && <p className="timeline-desc">{project?.description}</p>}
                        <div className="project-tech-stack">
                          {project?.techStack && project.techStack.map((tech, i) => (
                            <span key={i} className="tech-badge">{tech}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
};

export default Profile;
