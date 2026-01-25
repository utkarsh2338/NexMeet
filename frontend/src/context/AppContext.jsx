import React, { createContext, useContext, useState, useCallback } from 'react';

// Create contexts
const AppStateContext = createContext();
const AppActionsContext = createContext();

/**
 * Global App State Provider
 * Manages application-wide state and prevents prop drilling
 */
export const AppStateProvider = ({ children }) => {
    // Loading states
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // Connection states
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState(null);

    // Meeting states
    const [currentMeeting, setCurrentMeeting] = useState(null);
    const [meetingHistory, setMeetingHistory] = useState([]);

    // User states (synced with Clerk)
    const [userPreferences, setUserPreferences] = useState({
        audioEnabled: true,
        videoEnabled: true,
        preferredQuality: 'high'
    });

    // Actions
    const startLoading = useCallback((message = 'Loading...') => {
        setIsLoading(true);
        setLoadingMessage(message);
    }, []);

    const stopLoading = useCallback(() => {
        setIsLoading(false);
        setLoadingMessage('');
    }, []);

    const setError = useCallback((error) => {
        setConnectionError(error);
        stopLoading();
    }, [stopLoading]);

    const clearError = useCallback(() => {
        setConnectionError(null);
    }, []);

    const updateMeetingHistory = useCallback((meeting) => {
        setMeetingHistory(prev => {
            const exists = prev.find(m => m.code === meeting.code);
            if (exists) return prev;
            const updated = [meeting, ...prev];
            localStorage.setItem('meetingHistory', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const clearMeetingHistory = useCallback(() => {
        setMeetingHistory([]);
        localStorage.removeItem('meetingHistory');
    }, []);

    const state = {
        isLoading,
        loadingMessage,
        isConnecting,
        connectionError,
        currentMeeting,
        meetingHistory,
        userPreferences
    };

    const actions = {
        startLoading,
        stopLoading,
        setError,
        clearError,
        setIsConnecting,
        setCurrentMeeting,
        updateMeetingHistory,
        clearMeetingHistory,
        setUserPreferences
    };

    return (
        <AppStateContext.Provider value={state}>
            <AppActionsContext.Provider value={actions}>
                {children}
            </AppActionsContext.Provider>
        </AppStateContext.Provider>
    );
};

// Custom hooks for easy access
export const useAppState = () => {
    const context = useContext(AppStateContext);
    if (!context) {
        throw new Error('useAppState must be used within AppStateProvider');
    }
    return context;
};

export const useAppActions = () => {
    const context = useContext(AppActionsContext);
    if (!context) {
        throw new Error('useAppActions must be used within AppStateProvider');
    }
    return context;
};

// Combined hook for convenience
export const useApp = () => {
    return {
        ...useAppState(),
        ...useAppActions()
    };
};
