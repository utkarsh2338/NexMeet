import React from 'react'
import '../App.css'
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className='landingPageContainer'>
      <nav>
        <div className='navHeader'>
          <h2>NexMeet</h2>
        </div>
        <div className='navList'>
          <p>Join as Guest</p>
          <p>Register</p>
          <div role='button'>
            <p>Login</p>
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div style={{
          maxWidth: "650px",
          padding: "40px 30px",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        }}>
          <h1 style={{
            fontSize: "56px",
            lineHeight: "1.1",
            margin: "0 0 18px",
            fontWeight: "800",
            letterSpacing: "-1px",
            background: "linear-gradient(90deg, #00f5ff, #ff4ecd, #00ff99)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0px 0px 30px rgba(0, 245, 255, 0.15)"
          }}>
            Connect, Collaborate, <br /> and Create with NexMeet
          </h1>

          <p style={{
            fontSize: "18px",
            lineHeight: "1.6",
            margin: "0 0 28px",
            color: "rgba(255,255,255,0.78)",
            maxWidth: "560px"
          }}>
            Experience seamless virtual meetings with NexMeet - your all-in-one platform for video conferencing, collaboration, and productivity.
          </p>

          <div
            role="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "14px 26px",
              borderRadius: "14px",
              cursor: "pointer",
              userSelect: "none",
              fontWeight: "700",
              fontSize: "16px",
              letterSpacing: "0.3px",
              background: "linear-gradient(90deg, rgba(0,245,255,0.95), rgba(255,78,205,0.95))",
              boxShadow: "0px 12px 30px rgba(0, 245, 255, 0.18), 0px 10px 24px rgba(255, 78, 205, 0.12)",
              border: "1px solid rgba(255,255,255,0.12)",
              transition: "all 0.3s ease"
            }}
          >
            <Link to="/home
            " style={{
              margin: 0,
              color: "#050816"
            }}>
              Get Started
            </Link>
          </div>
        </div>
            <img src="/landing.jpg" alt="Landing Illustration" style={{ maxWidth: "80vh ", width: "100%" }} />
        </div>
      </div>
  )
}
