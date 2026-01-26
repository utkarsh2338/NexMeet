import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import "../styles/videoMeet.css"
import { TextField, Button } from '@mui/material'
import { io } from 'socket.io-client'
import { useParams } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { BsMicFill, BsMicMuteFill, BsCameraVideoFill, BsCameraVideoOffFill, BsStopCircleFill, BsChatDotsFill } from 'react-icons/bs'
import { MdScreenShare, MdCallEnd, MdSend } from 'react-icons/md'
import { ConnectionStatus, LoadingOverlay } from '../components/LoadingStates'
import { useApp } from '../context/AppContext'

const server = import.meta.env.VITE_BACKEND_SERVER_URL || "http://localhost:4000";

// Default ICE configuration with STUN servers only (fallback)
const getDefaultIceConfig = () => ({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 10
});

// Fetch ICE server configuration from backend (includes TURN servers if configured)
const fetchIceServers = async () => {
  try {
    const response = await fetch(`${server}/api/v1/meetings/turn-credentials`);
    if (response.ok) {
      const config = await response.json();
      const turnServers = config.iceServers?.filter(s => s.urls?.includes('turn:')) || [];
      console.log("ICE servers fetched from backend:", config.iceServers?.length || 0, "total,", turnServers.length, "TURN servers");
      if (turnServers.length === 0) {
        console.warn("⚠️ No TURN servers available - connection may fail behind symmetric NAT");
      } else {
        console.log("✅ TURN servers available for NAT traversal");
      }
      return {
        iceServers: config.iceServers || getDefaultIceConfig().iceServers,
        iceCandidatePoolSize: config.iceCandidatePoolSize || 10
      };
    } else {
      console.warn("Failed to fetch ICE servers, status:", response.status);
    }
  } catch (error) {
    console.warn("Failed to fetch ICE servers from backend, using defaults:", error.message);
  }
  return getDefaultIceConfig();
};

// This will be populated when the component mounts
let peerConnectionConfig = getDefaultIceConfig();

// Memoized remote video component to prevent unnecessary re-renders
const RemoteVideo = React.memo(({ video, index }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && video.stream) {
      videoRef.current.srcObject = video.stream;
    }
  }, [video.stream]);

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        data-socket={video.socketId}
        autoPlay
        playsInline
      ></video>
      <div className="video-label">
        <span>{video.username || `Participant ${index + 1}`}</span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the stream, socketId, or username changes
  return prevProps.video.socketId === nextProps.video.socketId &&
    prevProps.video.stream === nextProps.video.stream &&
    prevProps.video.username === nextProps.video.username;
});

export default function VideoMeet() {
  const { url } = useParams();
  const { user } = useUser();
  const { isLoading, startLoading, stopLoading } = useApp();

  // Refs - Move connections inside component to prevent global state issues
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoRef = useRef();
  const connectionsRef = useRef({}); // ✅ Fixed: Moved from global scope
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState();
  const [audio, setAudio] = useState();
  const [screen, setScreen] = useState();
  const [showModal, setShowModal] = useState(false);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const videoRef = useRef([]);
  const [videos, setVideos] = useState([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const screenStreamRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const remoteStreamsRef = useRef({}); // Track which socket IDs already have video entries to prevent duplicates
  const pendingIceCandidatesRef = useRef({}); // Queue ICE candidates until remote description is set

  // Helper functions for creating dummy media streams
  const silence = () => {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  const black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement('canvas'), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  const createBlackSilenceStream = () => {
    return new MediaStream([black(), silence()]);
  };

  const getpermissions = async () => {
    try {
      // Check video availability
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setVideoAvailable(true);
      } catch (e) {
        setVideoAvailable(false);
      }

      // Check audio availability
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioAvailable(true);
      } catch (e) {
        setAudioAvailable(false);
      }

      // Check screen share availability
      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      // Get initial media stream for preview
      try {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      } catch (err) {
        console.error("Error accessing media devices.", err);
        // CRITICAL: If permissions denied, create black/silence stream immediately
        // This ensures window.localStream is NEVER undefined
        console.log("Creating black/silence stream as fallback");
        window.localStream = createBlackSilenceStream();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = window.localStream;
        }
      }
    } catch (err) {
      console.error("Error in getpermissions.", err);
    }
  };

  useEffect(() => {
    // Fetch ICE servers configuration on mount
    const initIceServers = async () => {
      peerConnectionConfig = await fetchIceServers();
      console.log("ICE configuration initialized");
    };
    initIceServers();
    getpermissions();
  }, []);

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Error setting local stream.", err);
    }
    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    // Connect to socket server after we have the media stream
    if (socketRef.current === undefined || !socketRef.current.connected) {
      connectToSocketServer();
    }

    for (let id in connectionsRef.current) {
      if (id === socketIdRef.current) continue;
      // Replace existing tracks
      const senders = connectionsRef.current[id].getSenders();
      stream.getTracks().forEach(track => {
        const sender = senders.find(s => s.track && s.track.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        } else {
          connectionsRef.current[id].addTrack(track, stream);
        }
      });
      connectionsRef.current[id].createOffer().then((description) => {
        connectionsRef.current[id].setLocalDescription(description).then(() => {
          socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connectionsRef.current[id].localDescription }));
        }).catch((e) => {
          console.error("Error setting local description:", e);
        });
      })
        .catch((e) => {
          console.error("Error creating offer:", e);
        });
    }
    stream.getTracks().forEach(track => track.onended = () => {
      setVideo(false);
      setAudio(false);
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => {
          track.stop();
        });
      } catch (err) {
        console.error("Error stopping tracks.", err);
      }
      // Replace with black/silence stream
      window.localStream = createBlackSilenceStream();
      localVideoRef.current.srcObject = window.localStream;
      for (let id in connectionsRef.current) {
        const senders = connectionsRef.current[id].getSenders();
        window.localStream.getTracks().forEach(track => {
          const sender = senders.find(s => s.track && s.track.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track);
          } else {
            connectionsRef.current[id].addTrack(track, window.localStream);
          }
        });
        connectionsRef.current[id].createOffer().then((description) => {
          connectionsRef.current[id].setLocalDescription(description).then(() => {
            socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connectionsRef.current[id].localDescription }));
          }).catch((e) => {
            console.error("Error setting local description:", e);
          });
        })
          .catch((e) => {
            console.error("Error creating offer:", e);
          });
      }

    })

  }

  const getUserMedia = () => {
    if ((video !== undefined && videoAvailable) || (audio !== undefined && audioAvailable)) {
      navigator.mediaDevices.getUserMedia({
        video: video !== undefined ? video : false,
        audio: audio !== undefined ? audio : false
      })
        .then(getUserMediaSuccess)
        .catch(err => {
          console.error("Error accessing media devices.", err);
        });
    } else {
      try {
        if (window.localStream) {
          window.localStream.getTracks().forEach(track => track.stop());
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      } catch (err) {
        console.error("Error stopping tracks.", err);
      }
    }
  };

  useEffect(() => {
    if (video !== undefined || audio !== undefined) {
      getUserMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, video]);

  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      // Ensure connection exists
      if (!connectionsRef.current[fromId]) {
        console.warn("No connection exists for:", fromId, "- ignoring signal");
        return;
      }

      const pc = connectionsRef.current[fromId];

      if (signal.sdp) {
        const description = new RTCSessionDescription(signal.sdp);

        // Handle offer/answer based on current signaling state
        // This implements "perfect negotiation" to avoid glare
        const isOffer = description.type === 'offer';
        const isAnswer = description.type === 'answer';

        // For answers, only set if we're expecting one (have-local-offer state)
        if (isAnswer && pc.signalingState !== 'have-local-offer') {
          console.warn("Ignoring unexpected answer for:", fromId, "- state:", pc.signalingState);
          return;
        }

        // For offers, we might need to rollback if we also sent an offer (glare)
        if (isOffer && pc.signalingState === 'have-local-offer') {
          // Glare situation - both sides sent offers
          // The peer with lexicographically smaller ID wins (becomes the offerer)
          const weArePolite = socketIdRef.current > fromId;
          if (weArePolite) {
            console.log("Glare detected! Rolling back our offer for:", fromId);
            pc.setLocalDescription({ type: 'rollback' })
              .then(() => handleRemoteDescription(pc, description, fromId))
              .catch(e => console.error("Error rolling back:", e));
            return;
          } else {
            console.log("Glare detected! Ignoring their offer (we have priority):", fromId);
            return;
          }
        }

        handleRemoteDescription(pc, description, fromId);
      } else if (signal.ice) {
        // Add ICE candidate only if remote description is already set
        if (pc.remoteDescription && pc.remoteDescription.type) {
          console.log("Adding ICE candidate for:", fromId);
          pc.addIceCandidate(new RTCIceCandidate(signal.ice))
            .catch(e => console.error("Error adding ice candidate:", e));
        } else {
          // Queue ICE candidates if remote description not yet set
          console.log("Queuing ICE candidate for", fromId, "- remote description not yet set");
          if (!pendingIceCandidatesRef.current[fromId]) {
            pendingIceCandidatesRef.current[fromId] = [];
          }
          pendingIceCandidatesRef.current[fromId].push(signal.ice);
        }
      }
    }
  };

  // Helper function to handle setting remote description
  const handleRemoteDescription = (pc, description, fromId) => {
    pc.setRemoteDescription(description)
      .then(() => {
        console.log("Remote description set for:", fromId, "type:", description.type);

        // Process any queued ICE candidates now that remote description is set
        if (pendingIceCandidatesRef.current[fromId] && pendingIceCandidatesRef.current[fromId].length > 0) {
          console.log(`Processing ${pendingIceCandidatesRef.current[fromId].length} queued ICE candidates for:`, fromId);
          pendingIceCandidatesRef.current[fromId].forEach(candidate => {
            pc.addIceCandidate(new RTCIceCandidate(candidate))
              .catch(e => console.error("Error adding queued ice candidate:", e));
          });
          pendingIceCandidatesRef.current[fromId] = []; // Clear the queue
        }

        // If we received an offer, create and send an answer
        if (description.type === 'offer') {
          pc.createAnswer()
            .then((answer) => {
              pc.setLocalDescription(answer)
                .then(() => {
                  console.log("Local answer set for:", fromId);
                  socketRef.current.emit("signal", fromId, JSON.stringify({ "sdp": pc.localDescription }));
                })
                .catch(e => console.error("Error setting local description:", e));
            })
            .catch(e => console.error("Error creating answer:", e));
        }
      })
      .catch(e => console.error("Error setting remote description:", e, "state:", pc.signalingState));
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages(prevMessages => [...prevMessages, { data, sender, socketIdSender }]);
    setNewMessages(prevCount => prevCount + 1);
  }

  const connectToSocketServer = () => {
    setConnectionStatus('connecting');
    startLoading('Connecting to meeting...');

    socketRef.current = io(server, {
      secure: false,
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionStatus('disconnected');
      stopLoading();

      // Attempt manual reconnection
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        console.log(`Reconnecting in ${delay}ms... (Attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

        reconnectTimeoutRef.current = setTimeout(() => {
          setConnectionStatus('reconnecting');
          socketRef.current.connect();
        }, delay);
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      setConnectionStatus('disconnected');

      // Auto-reconnect for unexpected disconnects
      if (reason === 'io server disconnect') {
        // Server disconnected - try to reconnect
        socketRef.current.connect();
      }
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
    });

    socketRef.current.on('reconnect_failed', () => {
      console.error('Failed to reconnect after maximum attempts');
      setConnectionStatus('disconnected');
      stopLoading();
      alert('Failed to connect to meeting. Please refresh the page.');
    });

    socketRef.current.on('signal', gotMessageFromServer);
    socketRef.current.on('chat-message', addMessage);

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server with ID:', socketRef.current.id);
      socketIdRef.current = socketRef.current.id;
      setConnectionStatus('connected');
      stopLoading();
      reconnectAttemptsRef.current = 0;

      // Emit join-call event to join the room with username and clerkUserId
      socketRef.current.emit('join-call', url || 'default-room', username, user?.id || null);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
      if (error.code === 'ROOM_FULL') {
        alert(error.message);
        window.location.href = '/';
      }
    });

    socketRef.current.on('user-left', (id) => {
      console.log('User left:', id);
      setVideos((videos) => videos.filter(video => video.socketId !== id));
      delete remoteStreamsRef.current[id]; // Clean up the tracking ref
      delete pendingIceCandidatesRef.current[id]; // Clean up pending ICE candidates
      if (connectionsRef.current[id]) {
        connectionsRef.current[id].close();
        delete connectionsRef.current[id];
      }
    });

    socketRef.current.on('user-joined', (id, clients, usernames) => {
      console.log("User joined event received:", id, clients, usernames);

      clients.forEach((socketListId) => {
        // Skip creating connection to yourself
        if (socketListId === socketIdRef.current) {
          console.log("Skipping self:", socketListId);
          return;
        }

        // Only create a new connection if one doesn't already exist
        if (!connectionsRef.current[socketListId]) {
          console.log("Creating new peer connection for:", socketListId);

          connectionsRef.current[socketListId] = new RTCPeerConnection(peerConnectionConfig);

          connectionsRef.current[socketListId].onicecandidate = (event) => {
            if (event.candidate != null) {
              console.log("ICE candidate generated for:", socketListId);
              socketRef.current.emit("signal", socketListId, JSON.stringify({ "ice": event.candidate }));
            }
          };

          connectionsRef.current[socketListId].ontrack = (event) => {
            console.log("Received track from:", socketListId, event.track.kind);

            // Additional check: don't add your own stream
            if (socketListId === socketIdRef.current) {
              console.warn("Skipping own stream");
              return;
            }

            // Check if we've already created a video entry for this socketId
            // This prevents duplicates when both audio and video tracks arrive
            if (remoteStreamsRef.current[socketListId]) {
              console.log("Stream already exists for:", socketListId, "- updating with new track");
              // Stream already exists, just update it in state (both tracks are in event.streams[0])
              setVideos((videos) => {
                const updatedVideos = videos.map(video => {
                  if (video.socketId === socketListId) {
                    return { ...video, stream: event.streams[0] };
                  }
                  return video;
                });
                return updatedVideos;
              });
            } else {
              // First track from this peer - create new video entry
              remoteStreamsRef.current[socketListId] = true; // Mark as created
              const participantUsername = usernames?.[socketListId] || 'Unknown';
              console.log("Adding new video for:", socketListId, "with username:", participantUsername);

              let newVideo = {
                socketId: socketListId,
                stream: event.streams[0],
                autoPlay: true,
                playsInline: true,
                username: participantUsername
              };
              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          // Handle connection state changes
          connectionsRef.current[socketListId].onconnectionstatechange = () => {
            const pc = connectionsRef.current[socketListId];
            if (!pc) return;

            const state = pc.connectionState;
            console.log("Connection state for", socketListId, ":", state);

            // Handle failed connection - attempt ICE restart only if we're the "impolite" peer
            // (the one with the smaller socket ID) to avoid both sides restarting
            if (state === 'failed' && socketIdRef.current < socketListId) {
              console.log("Connection failed for", socketListId, "- attempting ICE restart (we are impolite peer)");

              // Only restart if in stable state
              if (pc.signalingState === 'stable') {
                pc.restartIce();
                pc.createOffer({ iceRestart: true })
                  .then((description) => {
                    return pc.setLocalDescription(description);
                  })
                  .then(() => {
                    console.log("ICE restart offer sent for:", socketListId);
                    socketRef.current.emit("signal", socketListId, JSON.stringify({ "sdp": pc.localDescription }));
                  })
                  .catch(e => console.error("Error during ICE restart:", e));
              } else {
                console.log("Cannot restart ICE - signaling state:", pc.signalingState);
              }
            } else if (state === 'failed') {
              console.log("Connection failed for", socketListId, "- waiting for peer to restart ICE");
            }
          };

          connectionsRef.current[socketListId].oniceconnectionstatechange = () => {
            const pc = connectionsRef.current[socketListId];
            if (!pc) return;

            const state = pc.iceConnectionState;
            console.log("ICE connection state for", socketListId, ":", state);

            // Don't attempt restart from here - let onconnectionstatechange handle it
            // This avoids duplicate restart attempts
          };

          // Add local tracks to the peer connection
          if (window.localStream !== undefined && window.localStream !== null) {
            console.log("Adding tracks to peer connection for:", socketListId);
            window.localStream.getTracks().forEach(track => {
              connectionsRef.current[socketListId].addTrack(track, window.localStream);
            });
          }
          else {
            console.warn("No local stream available for:", socketListId, "- this should not happen!");
            // Fallback: create black/silence stream if somehow window.localStream is still undefined
            window.localStream = createBlackSilenceStream();
            window.localStream.getTracks().forEach(track => {
              connectionsRef.current[socketListId].addTrack(track, window.localStream);
            });
          }
        }
      });

      // Determine who creates the offer using "polite peer" pattern
      // The peer with the lexicographically smaller socket ID creates the offer
      // This avoids "glare" (both sides creating offers simultaneously)
      if (id === socketIdRef.current) {
        // This user just joined - create offers only to users with higher socket IDs
        console.log("This user just joined. Creating offers for peers with higher socket IDs...");
        for (let peerId in connectionsRef.current) {
          if (peerId === socketIdRef.current) continue;

          // Only create offer if our ID is smaller (we are the "impolite" peer)
          if (socketIdRef.current < peerId) {
            console.log("Creating offer for:", peerId, "(our ID is smaller)");
            connectionsRef.current[peerId].createOffer().then((description) => {
              connectionsRef.current[peerId].setLocalDescription(description).then(() => {
                console.log("Offer created and set for:", peerId);
                socketRef.current.emit("signal", peerId, JSON.stringify({ "sdp": connectionsRef.current[peerId].localDescription }));
              }).catch((e) => {
                console.error("Error setting local description:", e);
              });
            }).catch((e) => {
              console.error("Error creating offer:", e);
            });
          } else {
            console.log("Waiting for offer from:", peerId, "(their ID is smaller)");
          }
        }
      } else {
        // Existing user - a new user joined with ID = id
        // Create offer only if our socket ID is smaller than the new user's ID
        if (connectionsRef.current[id] && socketIdRef.current < id) {
          console.log("Existing user creating offer for new user:", id, "(our ID is smaller)");
          connectionsRef.current[id].createOffer().then((description) => {
            connectionsRef.current[id].setLocalDescription(description).then(() => {
              console.log("Offer created for new user:", id);
              socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connectionsRef.current[id].localDescription }));
            }).catch((e) => {
              console.error("Error setting local description:", e);
            });
          }).catch((e) => {
            console.error("Error creating offer:", e);
          });
        } else if (connectionsRef.current[id]) {
          console.log("Waiting for offer from new user:", id, "(their ID is smaller)");
        }
      }
    });

    socketRef.current.on('user-disconnected', (socketId, timeConnected) => {
      console.log('User disconnected:', socketId, 'Time connected:', timeConnected);
      setVideos((videos) => videos.filter(video => video.socketId !== socketId));
      delete remoteStreamsRef.current[socketId]; // Clean up the tracking ref
      delete pendingIceCandidatesRef.current[socketId]; // Clean up pending ICE candidates
      if (connectionsRef.current[socketId]) {
        connectionsRef.current[socketId].close();
        delete connectionsRef.current[socketId];
      }
    });
  };

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    // Don't connect to socket server immediately - wait for media stream
  };

  const connect = () => {
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }
    setAskForUsername(false);
    getMedia();
  };

  const toggleMicrophone = () => {
    if (window.localStream) {
      const audioTrack = window.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (window.localStream) {
      const videoTrack = window.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setNewMessages(0);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socketRef.current) {
      socketRef.current.emit('chat-message', message, username, socketIdRef.current);
      setMessage('');
    }
  };

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing and switch back to camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      // Switch back to camera
      try {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false // Don't replace audio track
        });

        // Preserve existing audio track
        const audioTrack = window.localStream?.getAudioTracks()[0];
        const videoTrack = userMediaStream.getVideoTracks()[0];

        // Create new stream with video from camera and existing audio
        const newStream = new MediaStream();
        newStream.addTrack(videoTrack);
        if (audioTrack) {
          newStream.addTrack(audioTrack);
        }

        window.localStream = newStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
        }

        // Update peer connections with camera video stream only
        for (let id in connectionsRef.current) {
          const sender = connectionsRef.current[id].getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }

        setIsScreenSharing(false);
        setIsCameraOn(true);
      } catch (err) {
        console.error("Error switching back to camera:", err);
        alert('Failed to switch back to camera. Please check your permissions.');
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Preserve existing audio track
        const audioTrack = window.localStream?.getAudioTracks()[0];

        // Create new stream with screen video and existing audio
        const newStream = new MediaStream();
        newStream.addTrack(screenTrack);
        if (audioTrack) {
          newStream.addTrack(audioTrack);
        }

        window.localStream = newStream;

        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
        }

        // Update peer connections with screen stream
        for (let id in connectionsRef.current) {
          const sender = connectionsRef.current[id].getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        // Listen for when user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error("Error sharing screen:", err);
        // User cancelled or denied permission - don't show alert for cancel
        if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
          alert('Failed to share screen. Please check your permissions.');
        }
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop screen stream if active
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Stop local stream
      if (window.localStream) {
        window.localStream.getTracks().forEach(track => track.stop());
      }

      // Close all peer connections
      Object.keys(connectionsRef.current).forEach(id => {
        if (connectionsRef.current[id]) {
          connectionsRef.current[id].close();
          delete connectionsRef.current[id];
        }
      });

      // Clear remote streams tracking
      remoteStreamsRef.current = {};

      // Clear pending ICE candidates
      pendingIceCandidatesRef.current = {};

      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="video-meet-container">
      {/* Connection Status Indicator */}
      {!askForUsername && <ConnectionStatus status={connectionStatus} />}

      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay message={isLoading ? 'Connecting to meeting...' : ''} />}

      {
        askForUsername === true ?
          <div className="lobby-container">
            <h2>Enter into Lobby</h2>
            <TextField
              id="outlined-basic"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00ffff',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#00ffff',
                },
              }}
            />
            <Button
              variant="contained"
              onClick={connect}
              disabled={!username.trim()}
              sx={{
                backgroundColor: '#00ffff',
                color: '#050816',
                fontWeight: '600',
                padding: '12px 32px',
                fontSize: '1rem',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#00cccc',
                  boxShadow: '0 4px 20px rgba(0, 255, 255, 0.4)',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(0, 255, 255, 0.3)',
                  color: 'rgba(5, 8, 22, 0.5)',
                },
              }}
            >
              Join Meeting
            </Button>

            <div className="video-preview">
              <video ref={localVideoRef} autoPlay muted playsInline></video>
            </div>
          </div> :
          <div className="meeting-room">
            <div className="meeting-main">
              <div className="meeting-header">
                <div className="meeting-info">
                  <h1 className="meeting-title">Meeting Room</h1>
                  <span className="participant-count">
                    {videos.length + 1} {videos.length === 0 ? 'Participant' : 'Participants'}
                  </span>
                </div>
              </div>

              <div className="videos-grid">
                {/* Local Video */}
                <div className="video-container local">
                  <video ref={localVideoRef} autoPlay muted playsInline></video>
                  <div className="video-label you">
                    <span>You ({username})</span>
                  </div>
                </div>

                {/* Remote Videos */}
                {videos.map((video, index) => (
                  <RemoteVideo key={video.socketId} video={video} index={index} />
                ))}
              </div>

              <div className="meeting-controls">
                <button
                  className={`control-btn ${isMicOn ? 'active' : ''}`}
                  title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
                  onClick={toggleMicrophone}
                >
                  {isMicOn ? <BsMicFill size={24} /> : <BsMicMuteFill size={24} />}
                </button>
                <button
                  className={`control-btn ${isCameraOn ? 'active' : ''}`}
                  title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
                  onClick={toggleCamera}
                >
                  {isCameraOn ? <BsCameraVideoFill size={24} /> : <BsCameraVideoOffFill size={24} />}
                </button>
                <button
                  className={`control-btn ${isScreenSharing ? 'active' : ''}`}
                  title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                  onClick={toggleScreenShare}
                >
                  {isScreenSharing ? <BsStopCircleFill size={24} /> : <MdScreenShare size={24} />}
                </button>
                <button
                  className={`control-btn ${isChatOpen ? 'active' : ''}`}
                  title="Toggle Chat"
                  onClick={toggleChat}
                >
                  <BsChatDotsFill size={24} />
                  {newMessages > 0 && !isChatOpen && (
                    <span className="chat-badge">{newMessages}</span>
                  )}
                </button>
                <button
                  className="control-btn danger"
                  title="Leave Meeting"
                  onClick={() => {
                    // Stop screen stream if active
                    if (screenStreamRef.current) {
                      screenStreamRef.current.getTracks().forEach(track => track.stop());
                      screenStreamRef.current = null;
                    }

                    // Stop local stream
                    if (window.localStream) {
                      window.localStream.getTracks().forEach(track => track.stop());
                    }

                    // Close all peer connections
                    Object.keys(connectionsRef.current).forEach(id => {
                      if (connectionsRef.current[id]) {
                        connectionsRef.current[id].close();
                        delete connectionsRef.current[id];
                      }
                    });

                    // Disconnect socket
                    if (socketRef.current) {
                      socketRef.current.disconnect();
                      socketRef.current = null;
                    }

                    // Reset state
                    setVideos([]);
                    setMessages([]);
                    setIsScreenSharing(false);
                    setIsChatOpen(false);

                    // Return to lobby
                    setAskForUsername(true);
                  }}
                >
                  <MdCallEnd size={24} />
                </button>
              </div>
            </div>

            {isChatOpen && (
              <div className="chat-panel">
                <div className="chat-header">
                  <h3>Chat</h3>
                  <button className="close-chat" onClick={toggleChat}>×</button>
                </div>
                <div className="chat-messages" ref={chatMessagesRef}>
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`chat-message ${msg.socketIdSender === socketIdRef.current ? 'own-message' : ''}`}
                    >
                      <div className="message-sender">{msg.sender}</div>
                      <div className="message-content">{msg.data}</div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="no-messages">No messages yet. Start the conversation!</div>
                  )}
                </div>
                <form className="chat-input" onSubmit={sendMessage}>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button type="submit" disabled={!message.trim()}>
                    <MdSend size={20} />
                  </button>
                </form>
              </div>
            )}
          </div>
      }

    </div>
  )
}
