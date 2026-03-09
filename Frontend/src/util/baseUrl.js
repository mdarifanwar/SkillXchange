export const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    const host = window.location.hostname;
    const localOverride = import.meta.env.VITE_LOCALHOST;
    const isLocalHost = host === "localhost" || host === "127.0.0.1";

    if (isLocalHost && localOverride) {
      return localOverride;
    }

    return `http://${host}:8000`;
  }

  return import.meta.env.VITE_SERVER_URL;
};
