import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { useUser } from "../../util/UserContext";
import io from "socket.io-client";
import axios from "axios";
import { toast } from "react-toastify";
import Spinner from "react-bootstrap/Spinner";

const Room = () => {
    const { roomId } = useParams();
    const { user } = useUser();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user || !roomId) return;

        const socket = io(axios.defaults.baseURL);
        const chatId = roomId.split('-')[0];
        socket.emit("join chat", chatId);

        let zp = null;

        const initCall = async () => {
            try {
                // Fetch token from backend (server secret stays safe)
                const { data } = await axios.get(`/video/token/${roomId}`, {
                    withCredentials: true,
                });

                const kitToken = data.data.token;
                const appID = data.data.appId;

                zp = ZegoUIKitPrebuilt.create(kitToken);

                zp.joinRoom({
                    container: containerRef.current,
                    sharedLinks: [
                        {
                            name: 'Copy Link',
                            url: window.location.origin + `/room/${roomId}`,
                        },
                    ],
                    scenario: {
                        mode: ZegoUIKitPrebuilt.OneONoneCall,
                    },
                    showScreenSharingButton: true,
                    onLeaveRoom: () => {
                        socket.emit("video-call-end", { chatId });
                        navigate('/chats');
                    },
                });

                setLoading(false);
            } catch (err) {
                console.error("Video call setup failed:", err);
                if (err?.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                    navigate("/login");
                } else {
                    setError("Failed to start video call. Please try again.");
                    toast.error("Failed to start video call");
                }
                setLoading(false);
            }
        };

        initCall();

        return () => {
            socket.emit("video-call-end", { chatId });
            if (zp) zp.destroy();
            socket.disconnect();
        };
    }, [roomId, user, navigate]);

    if (error) {
        return (
            <div
                className="room-page"
                style={{
                    width: "100vw", height: "100vh", display: "flex",
                    flexDirection: "column", justifyContent: "center",
                    alignItems: "center", background: "#000", color: "#fff", gap: "1rem",
                }}
            >
                <p style={{ fontSize: "1.1rem" }}>{error}</p>
                <button
                    onClick={() => navigate("/chats")}
                    style={{
                        padding: "0.6rem 1.5rem", borderRadius: "8px",
                        border: "none", background: "#C3110C", color: "#fff",
                        cursor: "pointer", fontSize: "0.95rem",
                    }}
                >
                    Back to Chats
                </button>
            </div>
        );
    }

    return (
        <div
            className="room-page"
            style={{
                width: "100vw", height: "100vh", display: "flex",
                justifyContent: "center", alignItems: "center", background: "#000",
            }}
        >
            {loading && (
                <div style={{
                    position: "absolute", zIndex: 10, display: "flex",
                    flexDirection: "column", alignItems: "center", gap: "1rem", color: "#fff",
                }}>
                    <Spinner animation="border" variant="light" />
                    <p>Setting up video call...</p>
                </div>
            )}
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        </div>
    );
};

export default Room;
