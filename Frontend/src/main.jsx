import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import { BrowserRouter as Router } from "react-router-dom";
import axios from "axios";
import { UserContextProvider } from "./util/UserContext.jsx";
axios.defaults.baseURL = `${import.meta.env.VITE_API_URL}/api`;
axios.defaults.withCredentials = true;

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("userInfo");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <Router>
    <UserContextProvider>
      <App />
    </UserContextProvider>
  </Router>
);
