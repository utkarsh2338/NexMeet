import React, { useRef, useState, useEffect } from 'react'
import "../styles/videoMeet.css"
import { TextField, Button } from '@mui/material'
const server = import.meta.env.VITE_BACKEND_SERVER_URL || "http://localhost:4000";
var connections = {};
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

  var socketRef = useRef();
  var socketIdRef = useRef();
  let localVideoRef = useRef();
  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState();
  let [audio, setAudio] = useState();
  let [screen, setScreen] = useState();
  let [showModal, setShowModal] = useState();
  let [screenAvailable, setScreenAvailable] = useState();
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");
  const videoRef = useRef([]);
  let [videos, setVideos] = useState([]);

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

  const getUserMedia = () => {
    if ((video !== undefined && videoAvailable) || (audio !== undefined && audioAvailable)) {
      // Stop existing tracks first
      if (window.localStream) {
        window.localStream.getTracks().forEach(track => track.stop());
      }

      navigator.mediaDevices.getUserMedia({
        video: video !== undefined ? video : false,
        audio: audio !== undefined ? audio : false
      })
        .then(stream => {
          window.localStream = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }).catch(err => {
          console.error("Error accessing media devices.", err);
        });
    }
    else {
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
  }

  useEffect(() => {
    if (video !== undefined || audio !== undefined) {
      getUserMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, video]);

  const connectToSocketServer = () => {
    // TODO: Implement socket connection
    console.log("Connecting to socket server...");
  };

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  const connect = () => {
    setAskForUsername(false);
    getMedia();
  }
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
          </div> : <> </>
      }

    </div>
  )
}
