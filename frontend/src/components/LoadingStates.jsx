import React from 'react';
import { Skeleton, Box } from '@mui/material';
import './LoadingStates.css';

/**
 * Video Grid Skeleton Loader
 */
export const VideoGridSkeleton = () => {
    return (
        <Box className="video-grid-skeleton">
            {[1, 2, 3, 4].map((i) => (
                <Box key={i} className="video-skeleton">
                    <Skeleton
                        variant="rectangular"
                        width="100%"
                        height="100%"
                        animation="wave"
                        sx={{ borderRadius: '12px' }}
                    />
                    <Skeleton
                        variant="text"
                        width="60%"
                        height={30}
                        sx={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '10px'
                        }}
                    />
                </Box>
            ))}
        </Box>
    );
};

/**
 * Meeting History Skeleton Loader
 */
export const HistorySkeleton = () => {
    return (
        <Box className="history-skeleton">
            {[1, 2, 3].map((i) => (
                <Box key={i} className="history-item-skeleton">
                    <Skeleton variant="text" width="40%" height={30} />
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="text" width="50%" height={20} />
                </Box>
            ))}
        </Box>
    );
};

/**
 * Page Loading Overlay
 */
export const LoadingOverlay = ({ message = 'Loading...' }) => {
    return (
        <Box className="loading-overlay">
            <Box className="loading-spinner">
                <div className="spinner"></div>
                <p>{message}</p>
            </Box>
        </Box>
    );
};

/**
 * Button Loading State
 */
export const LoadingButton = ({ loading, children, ...props }) => {
    return (
        <button {...props} disabled={loading || props.disabled}>
            {loading ? (
                <>
                    <span className="button-spinner"></span>
                    <span style={{ marginLeft: '8px' }}>Loading...</span>
                </>
            ) : (
                children
            )}
        </button>
    );
};

/**
 * Connection Status Indicator
 */
export const ConnectionStatus = ({ status }) => {
    const statusConfig = {
        connected: { color: '#22c55e', text: 'Connected', pulse: false },
        connecting: { color: '#eab308', text: 'Connecting...', pulse: true },
        disconnected: { color: '#ef4444', text: 'Disconnected', pulse: false },
        reconnecting: { color: '#f97316', text: 'Reconnecting...', pulse: true }
    };

    const config = statusConfig[status] || statusConfig.disconnected;

    return (
        <Box className="connection-status">
            <span
                className={`status-indicator ${config.pulse ? 'pulse' : ''}`}
                style={{ backgroundColor: config.color }}
            />
            <span className="status-text">{config.text}</span>
        </Box>
    );
};
