import React from 'react';

/**
 * Background component with mesh gradient and grid lines.
 */
export const LiquidBackground: React.FC = () => {
    return (
        <>
            {/* Mesh gradient base */}
            <div
                className="fixed inset-0 -z-20"
                style={{
                    backgroundColor: '#e8e8e8',
                    backgroundImage: `
                        radial-gradient(at 40% 20%, rgba(200, 180, 255, 0.4) 0px, transparent 50%),
                        radial-gradient(at 80% 0%, rgba(255, 200, 220, 0.3) 0px, transparent 50%),
                        radial-gradient(at 0% 50%, rgba(180, 220, 255, 0.4) 0px, transparent 50%),
                        radial-gradient(at 80% 50%, rgba(255, 230, 200, 0.3) 0px, transparent 50%),
                        radial-gradient(at 0% 100%, rgba(200, 255, 220, 0.3) 0px, transparent 50%),
                        radial-gradient(at 80% 100%, rgba(255, 200, 255, 0.3) 0px, transparent 50%),
                        radial-gradient(at 40% 80%, rgba(220, 200, 255, 0.3) 0px, transparent 50%)
                    `
                }}
            />
            {/* Grid overlay */}
            <div
                className="fixed inset-0 -z-10 pointer-events-none opacity-[0.15]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }}
            />
        </>
    );
};
