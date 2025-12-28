import React, { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
    type?: 'success' | 'info' | 'error';
}

export const Toast: React.FC<ToastProps> = ({
    message,
    isVisible,
    onClose,
    duration = 3000,
    type = 'success'
}) => {
    const [isShowing, setIsShowing] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setIsShowing(true);
            const timer = setTimeout(() => {
                setIsShowing(false);
                setTimeout(onClose, 300); // Wait for animation to finish
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible && !isShowing) return null;

    const textColor = {
        success: 'text-green-600',
        info: 'text-blue-600',
        error: 'text-red-500'
    }[type];

    const icon = {
        success: '✓',
        info: 'ℹ',
        error: '✕'
    }[type];

    return (
        <div
            className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 w-[90%] sm:w-auto max-w-md ${isShowing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
        >
            <div className={`neu-flat ${textColor} px-4 py-3 sm:px-6 sm:py-3 rounded-xl sm:rounded-full flex items-center gap-3`}>
                <span className="text-xl font-bold shrink-0">{icon}</span>
                <span className="font-medium text-sm sm:text-base break-words">{message}</span>
            </div>
        </div>
    );
};
