import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Switch, FormControlLabel, FormGroup } from '@mui/material';
import { MdLock, MdPeople, MdSettings } from 'react-icons/md';
import './CreateMeetingModal.css';

const CreateMeetingModal = ({ open, onClose, onCreateMeeting, user }) => {
    const [meetingCode, setMeetingCode] = useState('');
    const [password, setPassword] = useState('');
    const [usePassword, setUsePassword] = useState(false);
    const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(false);
    const [settings, setSettings] = useState({
        maxParticipants: 50,
        muteOnEntry: false,
        disableChat: false,
        allowScreenShare: true,
        allowRecording: true,
        autoRecording: false
    });

    const handleCreate = () => {
        if (!meetingCode.trim()) {
            alert('Please enter a meeting code');
            return;
        }

        onCreateMeeting({
            meetingCode: meetingCode.trim(),
            hostClerkUserId: user.id,
            hostUsername: user.username || user.fullName || 'Host',
            password: usePassword ? password : null,
            waitingRoomEnabled,
            settings
        });

        // Reset form
        setMeetingCode('');
        setPassword('');
        setUsePassword(false);
        setWaitingRoomEnabled(false);
    };

    const generateRandomCode = () => {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        setMeetingCode(code);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                style: {
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    color: 'white',
                    borderRadius: '16px'
                }
            }}
        >
            <DialogTitle style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MdSettings size={24} color="#00ffff" />
                    <span>Create New Meeting</span>
                </div>
            </DialogTitle>

            <DialogContent style={{ padding: '24px' }}>
                <div className="form-section">
                    <TextField
                        fullWidth
                        label="Meeting Code"
                        value={meetingCode}
                        onChange={(e) => setMeetingCode(e.target.value)}
                        placeholder="Enter or generate a code"
                        sx={{
                            marginBottom: '16px',
                            '& .MuiOutlinedInput-root': {
                                color: 'white',
                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                '&.Mui-focused fieldset': { borderColor: '#00ffff' },
                            },
                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                            '& .MuiInputLabel-root.Mui-focused': { color: '#00ffff' },
                        }}
                    />
                    <Button
                        variant="outlined"
                        onClick={generateRandomCode}
                        style={{
                            color: '#00ffff',
                            borderColor: '#00ffff',
                            marginBottom: '24px'
                        }}
                    >
                        Generate Random Code
                    </Button>
                </div>

                <div className="form-section">
                    <FormControlLabel
                        control={
                            <Switch
                                checked={usePassword}
                                onChange={(e) => setUsePassword(e.target.checked)}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: '#00ffff',
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: '#00ffff',
                                    },
                                }}
                            />
                        }
                        label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MdLock size={20} />
                                <span>Password Protection</span>
                            </div>
                        }
                    />

                    {usePassword && (
                        <TextField
                            fullWidth
                            type="password"
                            label="Meeting Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{
                                marginTop: '12px',
                                '& .MuiOutlinedInput-root': {
                                    color: 'white',
                                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                    '&.Mui-focused fieldset': { borderColor: '#00ffff' },
                                },
                                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                                '& .MuiInputLabel-root.Mui-focused': { color: '#00ffff' },
                            }}
                        />
                    )}
                </div>

                <div className="form-section">
                    <FormControlLabel
                        control={
                            <Switch
                                checked={waitingRoomEnabled}
                                onChange={(e) => setWaitingRoomEnabled(e.target.checked)}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: '#00ffff',
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: '#00ffff',
                                    },
                                }}
                            />
                        }
                        label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MdPeople size={20} />
                                <span>Enable Waiting Room</span>
                            </div>
                        }
                    />
                </div>

                <div className="form-section">
                    <h4 style={{ margin: '16px 0 12px', color: '#00ffff' }}>Meeting Settings</h4>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.allowRecording}
                                    onChange={(e) => setSettings({ ...settings, allowRecording: e.target.checked })}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#00ffff' },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#00ffff' },
                                    }}
                                />
                            }
                            label="Allow Recording"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.allowScreenShare}
                                    onChange={(e) => setSettings({ ...settings, allowScreenShare: e.target.checked })}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#00ffff' },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#00ffff' },
                                    }}
                                />
                            }
                            label="Allow Screen Share"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.disableChat}
                                    onChange={(e) => setSettings({ ...settings, disableChat: e.target.checked })}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#00ffff' },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#00ffff' },
                                    }}
                                />
                            }
                            label="Disable Chat"
                        />
                    </FormGroup>
                </div>
            </DialogContent>

            <DialogActions style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Button onClick={onClose} style={{ color: '#aaa' }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleCreate}
                    variant="contained"
                    style={{
                        background: 'linear-gradient(135deg, #00ffff, #00d4ff)',
                        color: '#000',
                        fontWeight: 'bold'
                    }}
                >
                    Create Meeting
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateMeetingModal;
