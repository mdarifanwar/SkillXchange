import React, { useState, useEffect, createContext, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { notifySessionExpired } from "./sessionToast";
import axios from "axios";

const UserContext = createContext();

const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      // Define public routes where redirection to login is not required upon auth failure
      const publicRoutes = [
        "/",
        "/login",
        "/about_us",
        "/register",
        "/discover",
        "/reset-password",
        "/auth/google/callback",
      ];
      
      const storedUser = localStorage.getItem("userInfo");
      let parsedStoredUser = null;
      if (storedUser && storedUser !== "undefined") {
        try {
          parsedStoredUser = JSON.parse(storedUser);
        } catch (error) {
          console.warn("Invalid userInfo in localStorage", error);
          localStorage.removeItem("userInfo");
        }
      }

      if (parsedStoredUser) {
        setUser(prev => prev || parsedStoredUser);
      }
      
      // Determine if current route is public
      // For "/", we require exact match. For others, we allow sub-paths (e.g. /discover/foo)
      const isPublicRoute = publicRoutes.some(route => {
        if (route === "/") return location.pathname === "/";
        return location.pathname === route || location.pathname.startsWith(route);
      });

      // Optimization: If no user info stored, and we are on a known public route, 
      // we skip the check to prevent unnecessary 401 errors for guests.
      // However, if we are on a protected route (like /profile), we MUST check.
      if (!storedUser && isPublicRoute) {
        return; 
      }

      // If we are on a protected route, or if we have a stored user on a public route (might need to validate session),
      // we proceed to fetch. We do NOT redirect immediately based on localStorage, because the user might have just logged in
      // and has the cookie but not the localStorage item yet.

      try {
        const response = await axios.get("/user/getDetails", {
          withCredentials: true,
        });

        if (!response || response.status !== 200) {
           if (response && response.status === 401) {
             notifySessionExpired();
             localStorage.removeItem("userInfo");
             setUser(null);
             if (!isPublicRoute) {
               navigate("/login");
             }
             return;
           }
          throw new Error("Not authenticated");
        }

        if (response.data?.data) {
          setUser(response.data.data);
          localStorage.setItem("userInfo", JSON.stringify(response.data.data));
        }
      } catch (error) {
        // If we used fetch, network errors end up here
        const status = error?.response?.status;
        if (status === 401 || error.message === "Not authenticated") {
             // Handle network errors or auth errors gracefully
        }

        if (!storedUser && !isPublicRoute) {
          navigate("/login");
        }
      }
    };

    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navigate]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

const useUser = () => {
  return useContext(UserContext);
};

export { UserContextProvider, useUser };
