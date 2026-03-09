import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import { getApiBaseUrl } from "../../util/baseUrl";

// This component handles the Google OAuth callback
export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    const apiBaseUrl = getApiBaseUrl();

    // Wait a moment for the cookie to be set by the backend, then check if user is authenticated
    const timer = setTimeout(() => {
      // Try to fetch the current user
      fetch(`${apiBaseUrl}/user/registered/getDetails`, {
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          throw new Error("Failed to get user");
        })
        .then((data) => {
          if (data.data && data.data.username) {
            // User authenticated, set context and persist to localStorage
            setUser(data.data);
            localStorage.setItem("userInfo", JSON.stringify(data.data));
            navigate(`/profile/${data.data.username}`);
          } else {
            navigate("/login");
          }
        })
        .catch((err) => {
          console.error("Auth check failed:", err);
          navigate("/login");
        });
    }, 500); // Small delay to ensure cookie is set

    return () => clearTimeout(timer);
  }, [navigate, setUser]);

  return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Logging you in with Google...</div>;
}
