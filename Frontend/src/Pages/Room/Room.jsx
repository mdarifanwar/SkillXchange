import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { useUser } from "../../util/UserContext";
import io from "socket.io-client";
import axios from "axios";

const Room = () => {
    const { roomId } = useParams();
    const { user } = useUser();
    const navigate = useNavigate();
    const containerRef = useRef(null);

    useEffect(() => {
        if (!user || !roomId) return undefined;

        const socket = io(import.meta.env.VITE_API_URL);
        const chatId = roomId.split('-')[0];
        socket.emit("join chat", chatId);

        let zp = null;
        let isActive = true;

        const devAppId = Number(import.meta.env.VITE_ZEGO_APP_ID);
        const devSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

        // Fetch token from backend or use dev token
        const fetchToken = async () => {
            try {
                const userId = user._id || Date.now().toString();
                const userName = user.name || "Guest";

                let kitToken = "";
                if (import.meta.env.DEV && devAppId && devSecret) {
                    kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                        devAppId,
                        devSecret,
                        roomId,
                        userId,
                        userName
                    );
                } else {
                    const response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/video/token/${roomId}`,
                        { withCredentials: true }
                    );

                    if (!isActive) return;

                    const { token, appId } = response.data.data;

                    // Convert server token into a kit token for the prebuilt UI.
                    kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
                        Number(appId),
                        token,
                        roomId,
                        userId,
                        userName
                    );
                }

                if (!isActive) return;

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
                        const chatId = roomId.split('-')[0];
                        socket.emit("video-call-end", { chatId: chatId });
                        navigate('/chats');
                    }
                });
            } catch (error) {
                console.error("Failed to fetch video token:", error);
                alert("Failed to initialize video call. Please try again.");
            }
        };

        fetchToken();

        return () => {
            isActive = false;
            const chatId = roomId.split('-')[0];
            socket.emit("video-call-end", { chatId });
            if (zp) {
                zp.destroy();
            }
            socket.disconnect();
        };
    }, [roomId, user, navigate]);

    return (
        <div
            className="room-page"
            style={{ width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#000" }}
        >
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        </div>
    );
};

export default Room;
