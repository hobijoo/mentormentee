'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (data.success) {
            router.push('/');
            router.refresh();
        } else {
            setError(data.message || '로그인 실패');
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '430px', margin: '0 auto', height: '100dvh', backgroundColor: '#EEE9E7', color: 'white', overflow: 'hidden', touchAction: 'none' }}>
            <style>{`
                .login-input::placeholder {
                    color: black;
                    opacity: 1;
                }
            `}</style>
            <div className="safeTopInset" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#20317E', minHeight: 0 }}>
            <div id="header" style={{ width: '100%', flexShrink: 0 }}>
                <img src="/top.png" alt="Header Logo" style={{ width: '100%', height: 'auto', display: 'block', transform: 'translateZ(0)', pointerEvents: 'none' }} />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 30px', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ marginTop: '20px', marginBottom: '10px', paddingLeft: '5px' }}>
                    <img src="/mole.svg" style={{ width: '70px', height: 'auto', pointerEvents: 'none' }} alt="Mole" />
                </div>
                <div style={{ fontSize: '23px', fontWeight: '900', lineHeight: '1.4', marginBottom: '30px', letterSpacing: '-0.3px' }}>
                    부여된 계정 정보로<br/>로그인하세요.
                </div>
                
                <div style={{ 
                    backgroundColor: '#EAE1DF', padding: '25px', borderRadius: '12px', 
                    width: '100%', display: 'flex', flexDirection: 'column', gap: '15px', boxSizing: 'border-box'
                }}>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input
                            type="text"
                            placeholder="팀 번호"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="login-input"
                            style={{ 
                                padding: '16px 14px', borderRadius: '6px', border: '1px solid black', 
                                color: 'black', fontSize: '18px', backgroundColor: '#EAE1DF', 
                                outline: 'none', fontWeight: '900', WebkitAppearance: 'none'
                            }}
                        />
                        <input
                            type="password"
                            placeholder="로그인 코드"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="login-input"
                            style={{ 
                                padding: '16px 14px', borderRadius: '6px', border: '1px solid black', 
                                color: 'black', fontSize: '18px', backgroundColor: '#EAE1DF', 
                                outline: 'none', fontWeight: '900', WebkitAppearance: 'none'
                            }}
                        />
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button type="submit" style={{ 
                                width: '56px', height: '56px', borderRadius: '50%', border: 'none', 
                                backgroundColor: '#F1B329', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'transform 0.1s', padding: 0
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="4" y1="12" x2="20" y2="12"></line>
                                    <polyline points="13 5 20 12 13 19"></polyline>
                                </svg>
                            </button>
                        </div>
                    </form>
                    {error && <p style={{ color: '#ff6b6b', marginTop: '5px', textAlign: 'center', fontWeight: '800', fontSize: '15px' }}>{error}</p>}
                </div>
            </div>
            </div>
        </div>
    );
}
