import React from "react";
import "./AboutUs.css";

const AboutUs = () => {
  return (
    <section className="about-us-section">
      <div className="about-container">
        <div className="about-content">
          <h2 className="about-title">ABOUT US</h2>
          <div className="about-text">
            <p>
              As students, we have looked for upskilling everywhere. Mostly, we end up paying big amounts to gain
              certifications and learn relevant skills. We thought of SkillXchange to resolve that. Learning new skills and
              gaining more knowledge all while networking with talented people!
            </p>
            <p>
              At SkillXchange, we believe in the power of learning and sharing knowledge. Our platform connects individuals
              from diverse backgrounds to exchange practical skills and expertise. Whether you're a seasoned professional
              looking to mentor others or a beginner eager to learn, SkillXchange provides a supportive environment for growth
              and collaboration.
            </p>
            <p>
              Our mission is to empower individuals to unlock their full potential through skill sharing. By facilitating
              meaningful interactions and fostering a culture of lifelong learning, we aim to create a community where
              everyone has the opportunity to thrive.
            </p>
          </div>
        </div>
        <div className="about-image-container">
          <div className="about-image-frame">
            <img
              src="https://illustrations.popsy.co/amber/remote-work.svg"
              alt="About SkillXchange"
              className="about-hero-image"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
