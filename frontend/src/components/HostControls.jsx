import React from 'react';
import { Box, Button, List, ListItem, ListItemText, Avatar, IconButton } from '@mui/material';
import { MdCheck, MdClose } from 'react-icons/md';
import './HostControls.css';

export const WaitingRoomPanel = ({ waitingParticipants, onAdmit, onReject }) => {
    if (!waitingParticipants || waitingParticipants.length === 0) return null;

    return (
        <Box className="waiting-room-panel">
            <h3>Waiting Room ({waitingParticipants.length})</h3>
            <List>
                {waitingParticipants.map((participant) => (
                    <ListItem key={participant.socketId} className="waiting-participant">
                        <Avatar sx={{ bgcolor: '#00ffff', color: '#000', mr: 2 }}>
                            {participant.username?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <ListItemText
                            primary={participant.username}
                            secondary={`Waiting since ${new Date(participant.requestedAt).toLocaleTimeString()}`}
                        />
                        <IconButton
                            onClick={() => onAdmit(participant.socketId)}
                            sx={{ color: '#22c55e' }}
                        >
                            <MdCheck size={24} />
                        </IconButton>
                        <IconButton
                            onClick={() => onReject(participant.socketId)}
                            sx={{ color: '#ef4444' }}
                        >
                            <MdClose size={24} />
                        </IconButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export const ParticipantList = ({ participants, hostClerkUserId, currentUserClerkUserId, onRemove }) => {
    const isHost = hostClerkUserId === currentUserClerkUserId;

    return (
        <Box className="participant-list">
            <h3>Participants ({participants.length})</h3>
            <List>
                {participants.map((participant) => (
                    <ListItem key={participant.socketId} className="participant-item">
                        <Avatar sx={{ bgcolor: participant.isHost ? '#ffd700' : '#00ffff', color: '#000', mr: 2 }}>
                            {participant.username?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <ListItemText
                            primary={
                                <span>
                                    {participant.username}
                                    {participant.isHost && <span className="host-badge">Host</span>}
                                </span>
                            }
                        />
                        {isHost && !participant.isHost && (
                            <Button
                                size="small"
                                onClick={() => onRemove(participant.socketId, participant.username)}
                                sx={{
                                    color: '#ef4444',
                                    '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' }
                                }}
                            >
                                Remove
                            </Button>
                        )}
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export const RecordingControls = ({ isRecording, isHost, onStartRecording, onStopRecording }) => {
    if (!isHost) return null;

    return (
        <Box className="recording-controls">
            {!isRecording ? (
                <Button
                    variant="contained"
                    onClick={onStartRecording}
                    startIcon={<span>🔴</span>}
                    sx={{
                        background: '#ef4444',
                        '&:hover': { background: '#dc2626' }
                    }}
                >
                    Start Recording
                </Button>
            ) : (
                <Button
                    variant="contained"
                    onClick={onStopRecording}
                    startIcon={<span>⏹️</span>}
                    sx={{
                        background: '#6b7280',
                        '&:hover': { background: '#4b5563' }
                    }}
                >
                    Stop Recording
                </Button>
            )}
        </Box>
    );
};

export const PasswordPrompt = ({ open, onSubmit, onCancel }) => {
    const [password, setPassword] = React.useState('');

    if (!open) return null;

    return (
        <div className="password-overlay">
            <div className="password-modal">
                <h2>This meeting is password protected</h2>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="password-input"
                    onKeyPress={(e) => e.key === 'Enter' && onSubmit(password)}
                />
                <div className="password-actions">
                    <button onClick={onCancel} className="btn-cancel">Cancel</button>
                    <button onClick={() => onSubmit(password)} className="btn-submit">Join</button>
                </div>
            </div>
        </div>
    );
};
