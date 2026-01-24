import React, { useRef, useState, useEffect } from 'react'
import "../styles/videoMeet.css"
import { TextField, Button } from '@mui/material'
import { io } from 'socket.io-client'
import { useParams } from 'react-router-dom'

const server = import.meta.env.VITE_BACKEND_SERVER_URL || "http://localhost:4000";
const connections = {};
const peerConnectionConfig = {
  'iceServers': [
    { 'urls': 'stun:stun.services.mozilla.com' },
    { 'urls': 'stun:stun.l.google.com:19302' },
  ]
};

// stun servers are lightweight servers running on the public internet which return the 
// IP address of the requester. This is used to get the public IP address of a user
// behind a NAT.
export default function VideoMeet() {
  const { url } = useParams();

  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoRef = useRef();
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
  const screenStreamRef = useRef(null);

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
    }
  };

  useEffect(() => {
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
    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description).then(() => {
          socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
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
      // todo blacksilence
      let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
      window.localStream = blackSilence();
      localVideoRef.current.srcObject = window.localStream;
      for (let id in connections) {
        connections[id].addStream(window.localStream);
        connections[id].createOffer().then((description) => {
          connections[id].setLocalDescription(description).then(() => {
            socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
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
      if (signal.sdp) {
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
          if (signal.sdp.type === 'offer') {
            connections[fromId].createAnswer().then((description) => {
              connections[fromId].setLocalDescription(description).then(() => {
                socketRef.current.emit("signal", fromId, JSON.stringify({ "sdp": connections[fromId].localDescription }));
              }).catch(e => console.error("Error setting local description:", e));
            }).catch(e => console.error("Error creating answer:", e));
          }
        }).catch(e => console.error("Error setting remote description:", e));
      }
    }
    if (signal.ice) {
      connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.error("Error adding ice candidate:", e));
    }
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages(prevMessages => [...prevMessages, { data, sender, socketIdSender }]);
    setNewMessages(prevCount => prevCount + 1);
  }

  const connectToSocketServer = () => {
    socketRef.current = io(server, { secure: false });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
    });

    socketRef.current.on('signal', gotMessageFromServer);
    socketRef.current.on('chat-message', addMessage);

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server with ID:', socketRef.current.id);
      socketIdRef.current = socketRef.current.id;

      // Emit join-call event to join the room
      socketRef.current.emit('join-call', url || 'default-room');
    });

    socketRef.current.on('user-left', (id) => {
      setVideos((videos) => videos.filter(video => video.socketId !== id));
      if (connections[id]) {
        connections[id].close();
        delete connections[id];
      }
    });

    socketRef.current.on('user-joined', (id, clients) => {
      clients.forEach((socketListId) => {
        connections[socketListId] = new RTCPeerConnection(peerConnectionConfig);
        connections[socketListId].onicecandidate = (event) => {
          if (event.candidate != null) {
            socketRef.current.emit("signal", socketListId, JSON.stringify({ "ice": event.candidate }));
          }
        };
        connections[socketListId].onaddstream = (event) => {
          let videoExist = videoRef.current.find(video => video.socketId === socketListId);
          if (videoExist) {
            setVideos((videos) => {
              const updatedVideos = videos.map(video => {
                if (video.socketId === socketListId) {
                  return { ...video, stream: event.stream };
                }
                else return video;
              });
              videoRef.current = updatedVideos;
              return updatedVideos;
            });
          }
          else {
            let newVideo = { socketId: socketListId, stream: event.stream, autoPlay: true, playsInline: true };
            setVideos((videos) => {
              const updatedVideos = [...videos, newVideo];
              videoRef.current = updatedVideos;
              return updatedVideos;
            });
          }
        };
        if (window.localStream !== undefined && window.localStream !== null) {
          connections[socketListId].addStream(window.localStream);
        }
        else {
          let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          connections[socketListId].addStream(window.localStream);
        }
      });
      if (id === socketIdRef.current) {
        for (let id2 in connections) {
          if (id2 === socketIdRef.current) continue;
          try {
            connections[id2].addStream(window.localStream);
          } catch (err) {
            console.error("Error creating offer:", err);
          }
          connections[id2].createOffer().then((description) => {
            connections[id2].setLocalDescription(description).then(() => {
              socketRef.current.emit("signal", id2, JSON.stringify({ "sdp": connections[id2].localDescription }));
            }).catch((e) => {
              console.error("Error setting local description:", e);
            });
          }).catch((e) => {
            console.error("Error creating offer:", e);
          });
        }
      }
    });

    socketRef.current.on('user-disconnected', (socketId, timeConnected) => {
      console.log('User disconnected:', socketId, 'Time connected:', timeConnected);
      setVideos((videos) => videos.filter(video => video.socketId !== socketId));
      if (connections[socketId]) {
        connections[socketId].close();
        delete connections[socketId];
      }
    });
  };

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  const connect = () => {
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
          audio: true
        });

        window.localStream = userMediaStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = userMediaStream;
        }

        // Update peer connections with camera stream
        for (let id in connections) {
          const sender = connections[id].getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(userMediaStream.getVideoTracks()[0]);
          }
        }

        setIsScreenSharing(false);
        setIsCameraOn(true);
      } catch (err) {
        console.error("Error switching back to camera:", err);
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        screenStreamRef.current = screenStream;

        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Update peer connections with screen stream
        for (let id in connections) {
          const sender = connections[id].getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenStream.getVideoTracks()[0]);
          }
        }

        // Listen for when user stops sharing via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (window.localStream) {
        window.localStream.getTracks().forEach(track => track.stop());
      }
      Object.values(connections).forEach(conn => conn.close());
    };
  }, []);

  return (
    <div className="video-meet-container">
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
                <div key={video.socketId} className="video-container">
                  <video
                    data-socket={video.socketId}
                    ref={(ref) => {
                      if (ref && video.stream) {
                        ref.srcObject = video.stream;
                      }
                    }}
                    autoPlay
                    playsInline
                  ></video>
                  <div className="video-label">
                    <span>Participant {index + 1}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="meeting-controls">
              <button
                className={`control-btn ${isMicOn ? 'active' : ''}`}
                title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
                onClick={toggleMicrophone}
              >
                {isMicOn ? '🎤' : '🔇'}
              </button>
              <button
                className={`control-btn ${isCameraOn ? 'active' : ''}`}
                title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
                onClick={toggleCamera}
              >
                {isCameraOn ? '📹' : '📷'}
              </button>
              <button
                className={`control-btn ${isScreenSharing ? 'active' : ''}`}
                title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                onClick={toggleScreenShare}
              >
                {isScreenSharing ? '🛑' : '🖥️'}
              </button>
              <button
                className="control-btn danger"
                title="Leave Meeting"
                onClick={() => setAskForUsername(true)}
              >
                📞
              </button>
            </div>
          </div>
      }

    </div>
  )
}
