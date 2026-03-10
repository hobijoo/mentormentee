'use client';

import { useEffect, useState } from 'react';

export default function MobileGuard({ children }: { children: React.ReactNode }) {
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || (window as any).opera;
            // UA Check
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
            // Width Check
            const isSmallScreen = window.innerWidth <= 768; // Tablets/Mobiles threshold

            if (isMobileDevice && isSmallScreen) {
                setIsMobile(true);
            } else {
                setIsMobile(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Prevent hydration mismatch layout flicker
    if (isMobile === null) {
        return <div style={{ minHeight: '100vh', backgroundColor: '#20317E' }}></div>;
    }

    if (!isMobile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100vw', backgroundColor: '#20317E', color: 'white', padding: '20px', textAlign: 'center', boxSizing: 'border-box' }}>
                <div style={{ backgroundImage: "url('/mole.svg')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', width: '200px', height: '160px', marginBottom: '30px' }}></div>
                <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '15px' }}>모바일 환경에서 접속해주세요! 👋</h1>
                <p style={{ fontSize: '16px', color: '#e0e0e0', lineHeight: '1.6', fontWeight: 500 }}>
                    이 페이지는 모바일 기기에 최적화되어 있습니다.<br />
                    스마트폰의 웹 브라우저를 통해 접속해주세요.
                </p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', maxWidth: '430px', backgroundColor: '#20317E', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
            {children}
        </div>
    );
}
