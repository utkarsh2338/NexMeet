import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, UserButton } from '@clerk/clerk-react'
import { MdArrowBack, MdVideoCall, MdDelete, MdAccessTime } from 'react-icons/md'
import { BsClockHistory } from 'react-icons/bs'

export default function HistoryPage() {
    const { isSignedIn, isLoaded } = useUser();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            navigate('/');
            return;
        }

        // Load history from localStorage
        const savedHistory = JSON.parse(localStorage.getItem('meetingHistory') || '[]');
        setHistory(savedHistory);
    }, [isSignedIn, isLoaded, navigate]);

    const handleJoinMeeting = (code) => {
        navigate(`/${code}`);
    };

    const handleDeleteEntry = (index) => {
        const updatedHistory = history.filter((_, i) => i !== index);
        setHistory(updatedHistory);
        localStorage.setItem('meetingHistory', JSON.stringify(updatedHistory));
    };

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to clear all history?')) {
            setHistory([]);
            localStorage.removeItem('meetingHistory');
        }
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
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
            minHeight: '100vh',
            background: 'linear-gradient(rgba(0, 255, 255, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.07) 1px, transparent 1px), radial-gradient(circle at 70% 20%, rgba(255, 0, 150, 0.18), transparent 40%), radial-gradient(circle at 20% 80%, rgba(0, 255, 150, 0.15), transparent 45%), linear-gradient(135deg, #050816, #070B1A)',
            backgroundSize: '60px 60px, 60px 60px, auto, auto, auto',
            display: 'flex',
            flexDirection: 'column'
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
                        onClick={() => navigate('/home')}
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
                        }}
                        onMouseOut={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.05)';
                        }}
                    >
                        <MdArrowBack size={18} />
                        Back to Home
                    </button>
                    <UserButton afterSignOutUrl="/" />
                </div>
            </nav>

            {/* Main Content */}
            <div style={{
                flex: 1,
                padding: '40px',
                maxWidth: '1200px',
                width: '100%',
                margin: '0 auto'
            }}>
                <div style={{
                    marginBottom: '30px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                            margin: '0 0 10px',
                            color: '#fff',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <BsClockHistory />
                            Meeting History
                        </h1>
                        <p style={{
                            margin: 0,
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '16px'
                        }}>
                            View and rejoin your recent meetings
                        </p>
                    </div>

                    {history.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            style={{
                                padding: '12px 20px',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,78,78,0.3)',
                                background: 'rgba(255,78,78,0.1)',
                                color: '#ff4e4e',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = 'rgba(255,78,78,0.2)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'rgba(255,78,78,0.1)';
                            }}
                        >
                            <MdDelete size={18} />
                            Clear All
                        </button>
                    )}
                </div>

                {/* History List */}
                {history.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <BsClockHistory size={64} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '20px' }} />
                        <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '10px' }}>No meeting history yet</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                            Your recent meetings will appear here
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gap: '16px'
                    }}>
                        {history.map((entry, index) => (
                            <div
                                key={index}
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '20px',
                                    transition: 'all 0.3s ease',
                                    backdropFilter: 'blur(10px)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.borderColor = 'rgba(0,245,255,0.3)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        marginBottom: '8px'
                                    }}>
                                        <MdVideoCall size={24} style={{ color: '#00f5ff' }} />
                                        <h3 style={{
                                            margin: 0,
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            color: '#fff',
                                            fontFamily: 'monospace',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {entry.code}
                                        </h3>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: 'rgba(255,255,255,0.5)',
                                        fontSize: '14px'
                                    }}>
                                        <MdAccessTime size={16} />
                                        {formatDate(entry.timestamp)}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleJoinMeeting(entry.code)}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: 'linear-gradient(90deg, rgba(0,245,255,0.9), rgba(255,78,205,0.9))',
                                            color: '#050816',
                                            fontSize: '14px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            whiteSpace: 'nowrap'
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 6px 20px rgba(0,245,255,0.3)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    >
                                        Join Again
                                    </button>

                                    <button
                                        onClick={() => handleDeleteEntry(index)}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '10px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: '#ff4e4e',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.background = 'rgba(255,78,78,0.15)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.background = 'rgba(255,255,255,0.05)';
                                        }}
                                    >
                                        <MdDelete size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
