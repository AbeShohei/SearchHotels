import React from 'react';

/**
 * Simple static background component.
 * Previously implemented a WebGL shader-based liquid animation,
 * but simplified to a static color per user request.
 */
export const LiquidBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-gray-100 -z-10" />
    );
};
