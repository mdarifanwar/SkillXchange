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
    let cancelled = false;

    const redirectWithFallback = () => {
      if (usernameFromQuery) {
        const minimalUser = { username: usernameFromQuery };
        setUser(minimalUser);
        localStorage.setItem("userInfo", JSON.stringify(minimalUser));
        navigate(`/profile/${usernameFromQuery}`);
        return;
      }
      navigate("/login");
    };

    const attemptAuthCheck = (attempt) => {
      axios
        .get("/user/getDetails", { withCredentials: true })
        .then((res) => {
          if (cancelled) return;
          if (res.data?.data?.username) {
            setUser(res.data.data);
            localStorage.setItem("userInfo", JSON.stringify(res.data.data));
            navigate(`/profile/${res.data.data.username}`);
          } else {
            redirectWithFallback();
          }
        })
        .catch((err) => {
          if (cancelled) return;
          // Mobile browsers can delay cookie availability; retry a few times.
          if (attempt < 3) {
            setTimeout(() => attemptAuthCheck(attempt + 1), 700);
            return;
          }
          console.error("Auth check failed:", err);
          redirectWithFallback();
        });
    };

    const timer = setTimeout(() => attemptAuthCheck(0), 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate, setUser]);

  return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>Logging you in with Google...</div>;
}
