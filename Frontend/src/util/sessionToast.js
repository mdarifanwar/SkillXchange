import { toast } from "react-toastify";

let lastSessionToastAt = 0;
const SESSION_TOAST_COOLDOWN_MS = 4000;

export const notifySessionExpired = () => {
  const now = Date.now();
  if (now - lastSessionToastAt < SESSION_TOAST_COOLDOWN_MS) return;

  lastSessionToastAt = now;
  toast.info("Session expired, please re-login when needed");
};
