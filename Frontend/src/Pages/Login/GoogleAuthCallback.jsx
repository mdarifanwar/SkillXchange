import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import axios from "axios";

// This component handles the Google OAuth callback
export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const usernameFromQuery = params.get("username");

    // Wait a moment for the cookie to be set by the backend, then check if user is authenticated
    const timer = setTimeout(() => {
      // Try to fetch the current user
      axios
        .get("/user/getDetails", { withCredentials: true })
        .then((res) => {
          if (res.data?.data && res.data.data.username) {
            // User authenticated, set context and persist to localStorage
            setUser(res.data.data);
            localStorage.setItem("userInfo", JSON.stringify(res.data.data));
            navigate(`/profile/${res.data.data.username}`);
          } else if (usernameFromQuery) {
            const minimalUser = { username: usernameFromQuery };
            setUser(minimalUser);
            localStorage.setItem("userInfo", JSON.stringify(minimalUser));
            navigate(`/profile/${usernameFromQuery}`);
          } else {
            navigate("/login");
          }
        })
        .catch((err) => {
          console.error("Auth check failed:", err);
          if (usernameFromQuery) {
            const minimalUser = { username: usernameFromQuery };
            setUser(minimalUser);
            localStorage.setItem("userInfo", JSON.stringify(minimalUser));
            navigate(`/profile/${usernameFromQuery}`);
            return;
          }
          navigate("/login");
        });
    }, 500); // Small delay to ensure cookie is set

    return () => clearTimeout(timer);
  }, [navigate, setUser]);

  return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Logging you in with Google...</div>;
}
