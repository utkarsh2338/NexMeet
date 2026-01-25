import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, UserButton } from '@clerk/clerk-react'
import { MdHistory, MdVideoCall, MdArrowForward } from 'react-icons/md'
import { BsClockHistory } from 'react-icons/bs'

export default function HomeComponent() {
    const { isSignedIn, isLoaded, user } = useUser();
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            navigate('/');
        }
    }, [isSignedIn, isLoaded, navigate]);

    const handleJoinMeeting = () => {
        if (!meetingCode.trim()) {
            alert('Please enter a meeting code');
            return;
        }

        // Save to history
        const history = JSON.parse(localStorage.getItem('meetingHistory') || '[]');
        const newEntry = {
            code: meetingCode,
            timestamp: new Date().toISOString(),
            userEmail: user?.primaryEmailAddress?.emailAddress || 'Unknown'
        };

        // Add to beginning and keep only last 20 entries
        const updatedHistory = [newEntry, ...history.filter(h => h.code !== meetingCode)].slice(0, 20);
        localStorage.setItem('meetingHistory', JSON.stringify(updatedHistory));

        // Navigate to meeting
        navigate(`/${meetingCode}`);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleJoinMeeting();
        }
    };

    if (!isLoaded) {
        return (
            <div style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(rgba(0, 255, 255, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.07) 1px, transparent 1px), radial-gradient(circle at 70% 20%, rgba(255, 0, 150, 0.18), transparent 40%), radial-gradient(circle at 20% 80%, rgba(0, 255, 150, 0.15), transparent 45%), linear-gradient(135deg, #050816, #070B1A)',
                backgroundSize: '60px 60px, 60px 60px, auto, auto, auto',
                color: '#fff'
            }}>
                Loading...
            </div>
        );
    }

    if (!isSignedIn) {
        return null;
    }

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(rgba(0, 255, 255, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.07) 1px, transparent 1px), radial-gradient(circle at 70% 20%, rgba(255, 0, 150, 0.18), transparent 40%), radial-gradient(circle at 20% 80%, rgba(0, 255, 150, 0.15), transparent 45%), linear-gradient(135deg, #050816, #070B1A)',
            backgroundSize: '60px 60px, 60px 60px, auto, auto, auto',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Navbar */}
            <nav style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 40px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                background: 'rgba(255,255,255,0.02)'
            }}>
                <h2 style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: '800',
                    background: 'linear-gradient(90deg, #00f5ff, #ff4ecd)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    NexMeet
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button
                        onClick={() => navigate('/history')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 18px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(255,255,255,0.05)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.1)';
                            e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.05)';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        <BsClockHistory size={18} />
                        History
                    </button>
                    <UserButton afterSignOutUrl="/" />
                </div>
            </nav>

{/* History Implementation
What is localStorage?
localStorage is a built-in browser API that allows you to store key-value pairs persistently in the user's browser. Key characteristics:
(basically browser me hi store ho jata hai ye data
data tab tak rehta hai jab tak user manually delete na kare ya browser data clear na ho
synchronous API hai, iska matlab ye hai ki ye operations turant complete hote hain bina kisi callback ya promise ke)

Persists across sessions - Data remains even after closing the browser
Domain-specific - Each website has its own isolated storage
Storage limit - Typically 5-10 MB per domain
Synchronous - Operations are blocking (unlike databases)
String-only - Only stores strings (we use JSON.stringify/parse for objects)
Client-side only - Data stays in the browser, not sent to servers

How It Works in our App
1. When a user joins or creates a meeting, we capture the meeting code along with a timestamp and the user's email.
2. This data is stored as an array of meeting history objects in localStorage under the key 'meetingHistory'.
3. Each time a meeting is joined/created, we update this array, ensuring no duplicates and limiting it to the last 20 entries.
4. The history page retrieves this data from localStorage to display the user's recent meetings.

*/}

            {/* Main Content */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                gap: '60px',
                flexWrap: 'wrap'
            }}>
                {/* Left Panel */}
                <div style={{
                    maxWidth: '550px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '30px'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: 'clamp(2rem, 5vw, 3rem)',
                            lineHeight: '1.2',
                            margin: '0 0 16px',
                            fontWeight: '800',
                            color: '#fff',
                            letterSpacing: '-0.5px'
                        }}>
                            Join or Start a Meeting
                        </h1>
                        <p style={{
                            fontSize: '16px',
                            color: 'rgba(255,255,255,0.7)',
                            margin: 0,
                            lineHeight: '1.6'
                        }}>
                            Enter a meeting code to join an existing meeting or create a new one instantly.
                        </p>
                    </div>

                    {/* Meeting Code Input Card */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px',
                        padding: '32px',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                    }}>
                        <label style={{
                            display: 'block',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            <MdVideoCall style={{ verticalAlign: 'middle', marginRight: '8px' }} size={20} />
                            Meeting Code
                        </label>

                        <input
                            type="text"
                            value={meetingCode}
                            onChange={(e) => setMeetingCode(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Enter meeting code"
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                fontSize: '16px',
                                borderRadius: '12px',
                                border: '2px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#fff',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'rgba(0,245,255,0.5)';
                                e.target.style.background = 'rgba(255,255,255,0.08)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                                e.target.style.background = 'rgba(255,255,255,0.05)';
                            }}
                        />

                        <button
                            onClick={handleJoinMeeting}
                            style={{
                                width: '100%',
                                marginTop: '20px',
                                padding: '16px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(90deg, rgba(0,245,255,0.95), rgba(255,78,205,0.95))',
                                color: '#050816',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0px 8px 20px rgba(0, 245, 255, 0.2), 0px 6px 16px rgba(255, 78, 205, 0.15)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0px 12px 28px rgba(0, 245, 255, 0.3), 0px 8px 20px rgba(255, 78, 205, 0.2)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0px 8px 20px rgba(0, 245, 255, 0.2), 0px 6px 16px rgba(255, 78, 205, 0.15)';
                            }}
                        >
                            Join Meeting
                            <MdArrowForward size={20} />
                        </button>
                    </div>

                    <div style={{
                        padding: '20px',
                        background: 'rgba(0,245,255,0.05)',
                        border: '1px solid rgba(0,245,255,0.2)',
                        borderRadius: '12px',
                        fontSize: '14px',
                        color: 'rgba(255,255,255,0.8)',
                        lineHeight: '1.6'
                    }}>
                        <strong style={{ color: '#00f5ff' }}>💡 Tip:</strong> You can also create a new meeting by entering any unique code!
                    </div>
                </div>

                {/* Right Panel - Image */}
                <div style={{
                    maxWidth: '500px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img
                        src="/home.jpg"
                        alt="Meeting Illustration"
                        style={{
                            width: '100%',
                            height: 'auto',
                            borderRadius: '20px',
                            boxShadow: '0 20px 60px rgba(0,245,255,0.1)',
                            filter: 'drop-shadow(0 0 40px rgba(255,78,205,0.2))'
                        }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
