import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "react-bootstrap/Spinner";
import Form from "react-bootstrap/Form";
import { skills } from "./Skills";
import axios from "axios";
import "./EditProfile.css";
import Badge from "react-bootstrap/Badge";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "../../util/UserContext";
import { notifySessionExpired } from "../../util/sessionToast";

const EditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const { user, setUser } = useUser();

  const [form, setForm] = useState({
    profilePhoto: null,
    name: "",
    email: "",
    username: "",
    portfolioLink: "",
    githubLink: "",
    linkedinLink: "",
    skillsProficientAt: [],
    skillsToLearn: [],
    education: [
      {
        id: uuidv4(),
        institution: "",
        degree: "",
        startDate: "",
        endDate: "",
        score: "",
        description: "",
      },
    ],
    bio: "",
    projects: [],
  });
  const [skillsProficientAt, setSkillsProficientAt] = useState("Select some skill");
  const [skillsToLearn, setSkillsToLearn] = useState("Select some skill");
  const [searchProficient, setSearchProficient] = useState("");
  const [searchLearn, setSearchLearn] = useState("");
  const [showProficientDropdown, setShowProficientDropdown] = useState(false);
  const [showLearnDropdown, setShowLearnDropdown] = useState(false);
  const proficientRef = useRef(null);
  const learnRef = useRef(null);
  const [techStack, setTechStack] = useState([]);

  const [activeKey, setActiveKey] = useState("registration");

  // Close skill dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (proficientRef.current && !proficientRef.current.contains(e.target)) {
        setShowProficientDropdown(false);
      }
      if (learnRef.current && !learnRef.current.contains(e.target)) {
        setShowLearnDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      setForm((prevState) => ({
        ...prevState,
        name: user?.name,
        email: user?.email,
        username: user?.username,
        skillsProficientAt: user?.skillsProficientAt || [], // Default to empty array
        skillsToLearn: user?.skillsToLearn || [], // Default to empty array
        portfolioLink: user?.portfolioLink || "",
        githubLink: user?.githubLink || "",
        linkedinLink: user?.linkedinLink || "",
        education: user?.education?.map(edu => ({...edu, id: edu.id || uuidv4()})) || [], // Ensure IDs exist
        bio: user?.bio || "",
        projects: user?.projects?.map(proj => ({...proj, id: proj.id || uuidv4()})) || [], // Ensure IDs exist
      }));
      setTechStack(user?.projects?.map((project) => "Select some Tech Stack") || []);
    }
  }, [user]); // Added user dependency

  const handleNext = () => {
    const tabs = ["registration", "education", "longer-tab", "Preview"];
    const currentIndex = tabs.indexOf(activeKey);
    if (currentIndex < tabs.length - 1) {
      setActiveKey(tabs[currentIndex + 1]);
    }
  };

  const handleFileChange = async (e) => {
    const data = new FormData();
    data.append("picture", e.target.files[0]);
    try {
      toast.info("Uploading your pic please wait upload confirmation..");
      const response = await axios.post("/user/uploadPicture", data);
      toast.success("Pic uploaded successfully");
      setForm(() => {
        return {
          ...form,
          picture: response.data.data.url,
        };
      });
    } catch (error) {
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
        if (error.response.data.message === "Please Login") {
          notifySessionExpired();
          return;
        }
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setForm((prevState) => ({
        ...prevState,
        [name]: checked ? [...prevState[name], value] : prevState[name].filter((item) => item !== value),
      }));
    } else {
      if (name === "bio" && value.length > 500) {
        toast.error("Bio should be less than 500 characters");
        return;
      }
      setForm((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleAddSkill = (e) => {
    const { name } = e.target;
    if (name === "skill_to_learn") {
      if (skillsToLearn === "Select some skill") {
        toast.error("Select a skill to add");
        return;
      }
      if (form.skillsToLearn.includes(skillsToLearn)) {
        toast.error("Skill already added");
        return;
      }
      if (form.skillsProficientAt.includes(skillsToLearn)) {
        toast.error("Skill already added in skills proficient at");
        return;
      }
      setForm((prevState) => ({
        ...prevState,
        skillsToLearn: [...prevState.skillsToLearn, skillsToLearn],
      }));
      setSearchLearn("");
      setSkillsToLearn("Select some skill");
    } else {
      if (skillsProficientAt === "Select some skill") {
        toast.error("Select a skill to add");
        return;
      }
      if (form.skillsProficientAt.includes(skillsProficientAt)) {
        toast.error("Skill already added");
        return;
      }
      if (form.skillsToLearn.includes(skillsProficientAt)) {
        toast.error("Skill already added in skills to learn");
        return;
      }
      setForm((prevState) => ({
        ...prevState,
        skillsProficientAt: [...prevState.skillsProficientAt, skillsProficientAt],
      }));
      setSearchProficient("");
      setSkillsProficientAt("Select some skill");
    }
  };

  const handleRemoveSkill = (e, temp) => {
    const skill = e.target.innerText.split(" ")[0];
    if (temp === "skills_proficient_at") {
      setForm((prevState) => ({
        ...prevState,
        skillsProficientAt: prevState.skillsProficientAt.filter((item) => item !== skill),
      }));
    } else {
      setForm((prevState) => ({
        ...prevState,
        skillsToLearn: prevState.skillsToLearn.filter((item) => item !== skill),
      }));
    }
  };

  const handleRemoveEducation = (e, tid) => {
    // Check against either _id or id to support both existing and new items
    const updatedEducation = form.education.filter((item, i) => (item._id || item.id) !== tid);
    setForm((prevState) => ({
      ...prevState,
      education: updatedEducation,
    }));
  };

  const handleEducationChange = (e, index) => {
    const { name, value } = e.target;
    setForm((prevState) => ({
      ...prevState,
      education: prevState.education.map((item, i) => (i === index ? { ...item, [name]: value } : item)),
    }));
  };

  const handleAdditionalChange = (e, index) => {
    const { name, value } = e.target;
    setForm((prevState) => ({
      ...prevState,
      projects: prevState.projects.map((item, i) => (i === index ? { ...item, [name]: value } : item)),
    }));
  };

  const validateRegForm = () => {
    if (!form.username) {
      toast.error("Username is empty");
      return false;
    }
    if (!form.skillsProficientAt.length) {
      toast.error("Enter atleast one Skill you are proficient at");
      return false;
    }
    if (!form.skillsToLearn.length) {
      toast.error("Enter atleast one Skill you want to learn");
      return false;
    }
    if (!form.portfolioLink && !form.githubLink && !form.linkedinLink) {
      toast.error("Enter atleast one link among portfolio, github and linkedin");
      return false;
    }
    const githubRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?$/;
    if (form.githubLink && githubRegex.test(form.githubLink) === false) {
      toast.error("Enter a valid github link");
      return false;
    }
    const linkedinRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?$/;
    if (form.linkedinLink && linkedinRegex.test(form.linkedinLink) === false) {
      toast.error("Enter a valid linkedin link");
      return false;
    }
    if (form.portfolioLink && form.portfolioLink.includes("http") === false) {
      toast.error("Enter a valid portfolio link");
      return false;
    }
    return true;
  };
  const validateEduForm = () => {
    form.education.forEach((edu, index) => {
      if (!edu.institution) {
        toast.error(`Institution name is empty in education field ${index + 1}`);
        return false;
      }
      if (!edu.degree) {
        toast.error("Degree is empty");
        return false;
      }
      if (!edu.startDate) {
        toast.error("Start date is empty");
        return false;
      }
      if (!edu.endDate) {
        toast.error("End date is empty");
        return false;
      }
      if (!edu.score) {
        toast.error("Score is empty");
        return false;
      }
    });
    return true;
  };
  const validateAddForm = () => {
    if (!form.bio) {
      toast.error("Bio is empty");
      return false;
    }
    if (form.bio.length > 500) {
      toast.error("Bio should be less than 500 characters");
      return false;
    }
    var flag = true;
    form.projects.forEach((project, index) => {
      if (!project.title) {
        toast.error(`Title is empty in project ${index + 1}`);
        flag = false;
      }
      if (!project.techStack.length) {
        toast.error(`Tech Stack is empty in project ${index + 1}`);
        flag = false;
      }
      if (!project.startDate) {
        toast.error(`Start Date is empty in project ${index + 1}`);
        flag = false;
      }
      if (!project.endDate) {
        toast.error(`End Date is empty in project ${index + 1}`);
        flag = false;
      }
      if (!project.projectLink) {
        toast.error(`Project Link is empty in project ${index + 1}`);
        flag = false;
      }
      if (!project.description) {
        toast.error(`Description is empty in project ${index + 1}`);
        flag = false;
      }
      if (project.startDate > project.endDate) {
        toast.error(`Start Date should be less than End Date in project ${index + 1}`);
        flag = false;
      }
      if (!project.projectLink.match(/^(http|https):\/\/[^ "]+$/)) {
        toast.error(`Please provide valid project link in project ${index + 1}`);
        flag = false;
      }
    });
    return flag;
  };
  const handleSaveRegistration = async () => {
    const check = validateRegForm();
    if (check) {
      setSaveLoading(true);
      try {
        const { data } = await axios.post("/user/registered/saveRegDetails", form);
        toast.success("Details saved successfully");
      } catch (error) {
        if (error?.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Some error occurred");
        }
      } finally {
        setSaveLoading(false);
      }
    }
  };
  const handleSaveEducation = async () => {
    const check1 = validateRegForm();
    const check2 = validateEduForm();
    if (check1 && check2) {
      setSaveLoading(true);
      try {
        const { data } = await axios.post("/user/registered/saveEduDetail", form);
        toast.success("Details saved successfully");
      } catch (error) {
        if (error?.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Some error occurred");
        }
      } finally {
        setSaveLoading(false);
      }
    }
  };
  const handleSaveAdditional = async () => {
    const check1 = validateRegForm();
    const check2 = validateEduForm();
    const check3 = await validateAddForm();
    if (check1 && check2 && check3) {
      setSaveLoading(true);
      try {
        const { data } = await axios.post("/user/registered/saveAddDetail", form);
        toast.success("Details saved successfully");
      } catch (error) {
        if (error?.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Some error occurred");
        }
      } finally {
        setSaveLoading(false);
      }
    }
  };

  return (
    <div className="register_page ">
      <h1 className="page-title">
        Update Profile Details
      </h1>
      {loading ? (
        <div className="row m-auto w-100 d-flex justify-content-center align-items-center" style={{ height: "80.8vh" }}>
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <div className="register_section mb-3">
          <Tabs
            defaultActiveKey="registration"
            id="justify-tab-example"
            className="mb-3"
            activeKey={activeKey}
            onSelect={(k) => setActiveKey(k)}
          >
            <Tab eventKey="registration" title="Registration">
              {/* Name */}
              <div>
                <label>Name</label>
                <input
                  type="text"
                  name="username"
                  onChange={handleInputChange}
                  value={form.name}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Profile Photo</label>
                <br />
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </div>
              {/* Email */}
              <div className="form-group">
                <label>Email</label>
                <input
                  type="text"
                  name="username"
                  onChange={handleInputChange}
                  value={form.email}
                  disabled
                />
              </div>
              {/* Username */}
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  onChange={handleInputChange}
                  value={form.username}
                  placeholder="Enter your username"
                />
              </div>
              {/* Linkedin Profile Link*/}
              <div className="form-group">
                <label>Linkedin Link</label>
                <input
                  type="text"
                  name="linkedinLink"
                  value={form.linkedinLink}
                  onChange={handleInputChange}
                  placeholder="Enter your Linkedin link"
                />
              </div>
              {/* Github Profile Link*/}
              <div className="form-group">
                <label>Github Link</label>
                <input
                  type="text"
                  name="githubLink"
                  value={form.githubLink}
                  onChange={handleInputChange}
                  placeholder="Enter your Github link"
                />
              </div>
              {/* Portfolio Link */}
              <div className="form-group">
                <label>Portfolio Link</label>
                <input
                  type="text"
                  name="portfolioLink"
                  value={form.portfolioLink}
                  onChange={handleInputChange}
                  placeholder="Enter your portfolio link"
                />
              </div>
              {/* Skills Proficient At */}
              <div className="form-group">
                <label>Skills Proficient At</label>
                <div className="skill-search-wrapper" ref={proficientRef}>
                  <input
                    type="text"
                    className="skill-search-input"
                    placeholder="Search skills..."
                    value={searchProficient}
                    onChange={(e) => {
                      setSearchProficient(e.target.value);
                      setShowProficientDropdown(true);
                    }}
                    onFocus={() => setShowProficientDropdown(true)}
                  />
                  {showProficientDropdown && (
                    <ul className="skill-dropdown">
                      {skills
                        .filter((s) => s.toLowerCase().includes(searchProficient.toLowerCase()))
                        .map((skill, index) => (
                          <li
                            key={index}
                            className="skill-dropdown-item"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSkillsProficientAt(skill);
                              setSearchProficient(skill);
                              setShowProficientDropdown(false);
                            }}
                          >
                            {skill}
                          </li>
                        ))}
                      {skills.filter((s) => s.toLowerCase().includes(searchProficient.toLowerCase())).length === 0 && (
                        <li className="skill-dropdown-empty">No skills found</li>
                      )}
                    </ul>
                  )}
                </div>
                {form?.skillsProficientAt?.length > 0 && (
                  <div>
                    {form.skillsProficientAt.map((skill, index) => (
                      <Badge
                        key={index}
                        bg="secondary"
                        className="ms-2 mt-2"
                        style={{ cursor: "pointer" }}
                        onClick={(event) => handleRemoveSkill(event, "skills_proficient_at")}
                      >
                        <div className="span d-flex p-1 fs-7 ">{skill} &#10005;</div>
                      </Badge>
                    ))}
                  </div>
                )}
                <button className="btn btn-primary mt-3 ms-1" name="skill_proficient_at" onClick={handleAddSkill}>
                  Add Skill
                </button>
              </div>
              {/* Skills to learn */}
              <div className="form-group">
                <label style={{ color: "var(--text-main)", marginTop: "20px", fontWeight: "600", fontSize: "15px", display: "block", marginBottom: "12px" }}>Skills To Learn</label>
                <div className="skill-search-wrapper" ref={learnRef}>
                  <input
                    type="text"
                    className="skill-search-input"
                    placeholder="Search skills..."
                    value={searchLearn}
                    onChange={(e) => {
                      setSearchLearn(e.target.value);
                      setShowLearnDropdown(true);
                    }}
                    onFocus={() => setShowLearnDropdown(true)}
                  />
                  {showLearnDropdown && (
                    <ul className="skill-dropdown">
                      {skills
                        .filter((s) => s.toLowerCase().includes(searchLearn.toLowerCase()))
                        .map((skill, index) => (
                          <li
                            key={index}
                            className="skill-dropdown-item"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSkillsToLearn(skill);
                              setSearchLearn(skill);
                              setShowLearnDropdown(false);
                            }}
                          >
                            {skill}
                          </li>
                        ))}
                      {skills.filter((s) => s.toLowerCase().includes(searchLearn.toLowerCase())).length === 0 && (
                        <li className="skill-dropdown-empty">No skills found</li>
                      )}
                    </ul>
                  )}
                </div>
                {form?.skillsToLearn?.length > 0 && (
                  <div>
                    {form.skillsToLearn.map((skill, index) => (
                      <Badge
                        key={index}
                        bg="secondary"
                        className="ms-2 mt-2 "
                        style={{ cursor: "pointer" }}
                        onClick={(event) => handleRemoveSkill(event, "skills_to_learn")}
                      >
                        <div className="span d-flex p-1 fs-7 ">{skill} &#10005;</div>
                      </Badge>
                    ))}
                  </div>
                )}
                <button className="btn btn-primary mt-3 ms-1" name="skill_to_learn" onClick={handleAddSkill}>
                  Add Skill
                </button>
              </div>
              <div className="row m-auto d-flex justify-content-center mt-3">
                <button className="btn btn-warning" onClick={handleSaveRegistration} disabled={saveLoading}>
                  {saveLoading ? <Spinner animation="border" variant="primary" /> : "Save"}
                </button>
                <button onClick={handleNext} className="mt-2 btn btn-primary">
                  Next
                </button>
              </div>
            </Tab>
            <Tab eventKey="education" title="Education">
              {form?.education?.map((edu, index) => (
                <div className="form-group border border-secondary rounded p-3 my-3" key={edu._id || edu.id}>
                  {index !== 0 && (
                    <div className="d-flex justify-content-end mb-2">
                      <button className="btn btn-sm btn-secondary" onClick={(e) => handleRemoveEducation(e, edu._id || edu.id)}>
                        Remove
                      </button>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Institution Name</label>
                    <input
                      type="text"
                      name="institution"
                      value={edu.institution}
                      onChange={(e) => handleEducationChange(e, index)}
                      placeholder="Enter your institution name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Degree</label>
                    <input
                      type="text"
                      name="degree"
                      value={edu.degree}
                      onChange={(e) => handleEducationChange(e, index)}
                      placeholder="Enter your degree"
                    />
                  </div>
                  <div className="form-group">
                    <label>Grade/Percentage</label>
                    <input
                      type="number"
                      name="score"
                      value={edu.score}
                      onChange={(e) => handleEducationChange(e, index)}
                      placeholder="Enter your grade/percentage"
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Start Date</label>
                        <input
                          type="date"
                          name="startDate"
                          value={edu.startDate ? new Date(edu.startDate).toISOString().split("T")[0] : ""}
                          onChange={(e) => handleEducationChange(e, index)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="mt-2" style={{ color: "var(--text-main)", fontWeight: "600", fontSize: "14px", display: "block", marginBottom: "8px" }}>
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={edu.endDate ? new Date(edu.endDate).toISOString().split("T")[0] : ""}
                        onChange={(e) => handleEducationChange(e, index)}
                        style={{
                          borderRadius: "5px",
                          border: "1px solid var(--light-cyan)",
                          padding: "8px",
                          width: "100%",
                          backgroundColor: "rgba(var(--glass-color), 0.06)",
                          color: "var(--text-main)",
                        }}
                      />
                    </div>
                  </div>
                  <label className="mt-2" style={{ color: "var(--text-main)", fontWeight: "600", fontSize: "14px", display: "block", marginBottom: "8px" }}>
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={edu.description}
                    onChange={(e) => handleEducationChange(e, index)}
                    style={{
                      borderRadius: "5px",
                      border: "1px solid var(--light-cyan)",
                      padding: "8px",
                      width: "100%",
                      backgroundColor: "rgba(var(--glass-color), 0.06)",
                      color: "var(--text-main)",
                    }}
                    placeholder="Enter your exp or achievements"
                  />
                </div>
              ))}
              <div className="row my-2 d-flex justify-content-center">
                <button
                  className="btn btn-primary w-50"
                  onClick={() => {
                    setForm((prevState) => ({
                      ...prevState,
                      education: [
                        ...prevState.education,
                        {
                          id: uuidv4(),
                          institution: "",
                          degree: "",
                          startDate: "",
                          endDate: "",
                          score: "",
                          description: "",
                        },
                      ],
                    }));
                  }}
                >
                  Add Education
                </button>
              </div>
              <div className="row m-auto d-flex justify-content-center mt-3">
                <button className="btn btn-warning" onClick={handleSaveEducation} disabled={saveLoading}>
                  {saveLoading ? <Spinner animation="border" variant="primary" /> : "Save"}
                </button>
                <button onClick={handleNext} className="mt-2 btn btn-primary">
                  Next
                </button>
              </div>
            </Tab>
            <Tab eventKey="longer-tab" title="Additional">
              <div className="form-group">
                <label>Bio (Max 500 Character)</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleInputChange}
                  placeholder="Enter your bio"
                  rows="4"
                ></textarea>
              </div>
              <div className="form-group">
                <label>Projects</label>

                {form?.projects?.map((project, index) => (
                  <div className="form-group border border-secondary rounded p-3 my-3" key={project._id || project.id}>
                    <div className="d-flex justify-content-end mb-2">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setForm((prevState) => ({
                            ...prevState,
                            projects: prevState.projects.filter((item) => (item._id || item.id) !== (project._id || project.id)),
                          }));
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        name="title"
                        value={project.title}
                        onChange={(e) => handleAdditionalChange(e, index)}
                        placeholder="Enter your project title"
                      />
                    </div>
                    <div className="form-group">
                      <label>Tech Stack</label>
                      <Form.Select
                        aria-label="Default select example"
                        value={techStack[index]}
                        onChange={(e) => {
                          setTechStack((prevState) => prevState.map((item, i) => (i === index ? e.target.value : item)));
                        }}
                      >
                        <option>Select some Tech Stack</option>
                      {skills.map((skill, index) => (
                        <option key={index} value={skill}>
                          {skill}
                        </option>
                      ))}
                    </Form.Select>
                    {techStack[index].length > 0 && (
                      <div>
                        {form?.projects[index]?.techStack.map((skill, i) => (
                          <Badge
                            key={i}
                            bg="secondary"
                            className="ms-2 mt-2"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => {
                              setForm((prevState) => ({
                                ...prevState,
                                projects: prevState.projects.map((item, i) =>
                                  i === index
                                    ? { ...item, techStack: item.techStack.filter((item) => item !== skill) }
                                    : item
                                ),
                              }));
                            }}
                          >
                            <div className="span d-flex p-1 fs-7 ">{skill} &#10005;</div>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <button
                      className="btn btn-primary mt-3 ms-1"
                      name="tech_stack"
                      onClick={(e) => {
                        if (techStack[index] === "Select some Tech Stack") {
                          toast.error("Select a tech stack to add");
                          return;
                        }
                        if (form.projects[index].techStack.includes(techStack[index])) {
                          toast.error("Tech Stack already added");
                          return;
                        }
                        setForm((prevState) => ({
                          ...prevState,
                          projects: prevState.projects.map((item, i) =>
                            i === index ? { ...item, techStack: [...item.techStack, techStack[index]] } : item
                          ),
                        }));
                      }}
                    >
                      Add Tech Stack
                    </button>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Start Date</label>
                          <input
                            type="date"
                            name="startDate"
                            value={project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : ""}
                            onChange={(e) => handleAdditionalChange(e, index)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>End Date</label>
                          <input
                            type="date"
                            name="endDate"
                            value={project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : ""}
                            onChange={(e) => handleAdditionalChange(e, index)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Project Link</label>
                      <input
                        type="text"
                        name="projectLink"
                        value={project.projectLink}
                        onChange={(e) => handleAdditionalChange(e, index)}
                        placeholder="Enter your project link"
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        name="description"
                        value={project.description}
                        onChange={(e) => handleAdditionalChange(e, index)}
                        placeholder="Enter your project description"
                        rows="3"
                      />
                    </div>
                    </div>
                  </div>
                ))}

                <div className="row my-2 d-flex justify-content-center">
                  <button
                    className="btn btn-primary w-50"
                    onClick={() => {
                      setTechStack((prevState) => {
                        return [...prevState, "Select some Tech Stack"];
                      });
                      setForm((prevState) => ({
                        ...prevState,
                        projects: [
                          ...prevState.projects,
                          {
                            id: uuidv4(),
                            title: "",
                            techStack: [],
                            startDate: "",
                            endDate: "",
                            projectLink: "",
                            description: "",
                          },
                        ],
                      }));
                    }}
                  >
                    Add Project
                  </button>
                </div>
              </div>
              <div className="row m-auto d-flex justify-content-center mt-3">
                <button className="btn btn-warning" onClick={handleSaveAdditional} disabled={saveLoading}>
                  {saveLoading ? <Spinner animation="border" variant="primary" /> : "Save"}
                </button>
                {/* <button onClick={handleNext} className="mt-2 btn btn-primary">
                  Next
                </button> */}
              </div>
            </Tab>
            {/* <Tab eventKey="Preview" title="Confirm Details">
              <div>
                <h3 style={{ color: "var(--cyan)", marginBottom: "20px" }} className="link w-100 text-center">
                  Preview of the Form
                </h3>
                <div
                  className="previewForm"
                  style={{ fontFamily: "Montserrat, sans-serif", color: "#2d2d2d", marginBottom: "20px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "70vw",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "1.5rem",
                    }}
                    className="link m-sm-0"
                  >
                    <span style={{ flex: 1, fontWeight: "bold", color: "var(--cyan)" }}>Name:</span>
                    <span style={{ flex: 2 }}>{form.name || "Yet to be filled"}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: "70vw",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "1.5rem",
                    }}
                    className="link"
                  >
                    <span style={{ flex: 1, fontWeight: "bold", color: "var(--cyan)" }}>Email ID:</span>
                    <span style={{ flex: 2 }}>{form.email || "Yet to be filled"}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: "70vw",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "1.5rem",
                    }}
                    className="link"
                  >
                    <span style={{ flex: 1, fontWeight: "bold", color: "var(--cyan)" }}>Username:</span>
                    <span style={{ flex: 2 }}>{form.username || "Yet to be filled"}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: "70vw",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "1.5rem",
                    }}
                    className="link"
                  >
                    <span style={{ flex: 1, fontWeight: "bold", color: "var(--cyan)" }}>Portfolio Link:</span>
                    <span style={{ flex: 2 }}>{form.portfolioLink || "Yet to be filled"}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: "70vw",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "1.5rem",
                    }}
                    className="link"
                  >
                    <span style={{ flex: 1, fontWeight: "bold", color: "var(--cyan)" }}>Github Link:</span>
                    <span style={{ flex: 2 }}>{form.githubLink || "Yet to be filled"}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: "70vw",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      marginBottom: "10px",
                    }}
                    className="link"
                  >
                    <span style={{ flex: 1, fontWeight: "bold", color: "var(--cyan)" }}>Linkedin Link:</span>
                    <span
                      style={{
                        width: "70vw",
                        alignItems: "center",
                        flex: 2,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        marginBottom: "1.5rem",
                      }}
                    >
                      {form.linkedinLink || "Yet to be filled"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: "70vw",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "1.5rem",
                    }}
                    className="link"
                  >
                    <span style={{ flex: 1, fontWeight: "bold", color: "var(--cyan)" }}>Skills Proficient At:</span>
                    <span style={{ flex: 2 }}>{form?.skillsProficientAt?.join(", ") || "Yet to be filled"}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: "70vw",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "1.5rem",
                    }}
                    className="link"
                  >
                    <span style={{ flex: 1, fontWeight: "bold", color: "var(--cyan)" }}>Skills To Learn:</span>
                    <span style={{ flex: 2 }}>{form?.skillsToLearn?.join(", ") || "Yet to be filled"}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      width: "70vw",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "1.5rem",
                    }}
                    className="link"
                  >
                    <span style={{ flex: 1, fontWeight: "bold", color: "var(--cyan)" }}>Bio:</span>
                    <span style={{ flex: 2 }}>{form?.bio || "Yet to be filled"}</span>
                  </div>
                </div>
                <div className="row">
                  <button
                    onClick={handleSubmit}
                    style={{
                      backgroundcolor: "var(--cyan)",
                      color: "var(--text-color)",
                      padding: "10px 20px",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                    className="w-50 d-flex m-auto text-center align-content-center justify-content-center"
                  >
                    {saveLoading ? <Spinner animation="border" variant="primary" /> : "Submit"}
                  </button>
                </div>
              </div>
            </Tab> */}
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default EditProfile;
