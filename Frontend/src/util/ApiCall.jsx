import { toast } from "react-toastify";
import axios from "axios";
import { notifySessionExpired } from "./sessionToast";

const ApiCall = async (url, method, navigate, setUser, data) => {
  console.log("******** Inside ApiCall function ********");

  if (method === "GET") {
    try {
      const response = await axios.get(url, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error("Error in API call:", error);
      
      if (error.response && error.response.status === 401) {
        notifySessionExpired();
        localStorage.removeItem("userInfo");
        if (setUser) setUser(null);
        navigate("/login");
      } else if (error.response && error.response.status === 404) {
        toast.error("The requested resource was not found.");
        navigate("/");
      } else if (error.response && error.response.status === 500) {
        toast.error("Server Error. Please try again later.");
      } else {
        toast.error("An error occurred. Please try again later.");
      }
    }
  } else if (method === "POST") {
    try {
      const response = await axios.post(url, data, { withCredentials: true });
      return response.data;
    } catch (error) {
      console.error("Error in API call:", error);
      
      if (error.response && error.response.status === 401) {
        notifySessionExpired();
        localStorage.removeItem("userInfo");
        if (setUser) setUser(null);
        navigate("/login");
      } else if (error.response && error.response.status === 404) {
        toast.error("The requested resource was not found.");
        navigate("/");
      } else if (error.response && error.response.status === 500) {
        toast.error("Server Error. Please try again later.");
      } else {
        toast.error("An error occurred. Please try again later.");
      }
    }
  }
};

export default ApiCall;
