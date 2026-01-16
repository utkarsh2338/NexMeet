import React, { use, useState } from 'react'

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

  return (
    <div><VideoMeet /></div>
  )
}
