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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100dvh', backgroundColor: '#20317E', color: 'white', overflow: 'hidden' }}>
            <div id="header" style={{ width: '100%', flexShrink: 0 }}>
                <img src="/top.svg" alt="Header Logo" style={{ width: '100%', height: 'auto', display: 'block', transform: 'translateZ(0)' }} />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0 20px', position: 'relative' }}>
                <div style={{
                    position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
                    width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(241,179,41,0.25) 0%, rgba(32,49,126,0) 65%)',
                    pointerEvents: 'none', filter: 'blur(30px)'
                }}></div>

                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '40px 30px', borderRadius: '30px',
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', width: '100%', maxWidth: '350px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)',
                    display: 'flex', flexDirection: 'column', zIndex: 10
                }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                            <span style={{ fontSize: '32px' }}>🔒</span>
                        </div>
                    </div>

                    <h2 style={{ textAlign: 'center', marginBottom: '25px', fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>팀 로그인</h2>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <input
                            type="text"
                            placeholder="팀 ID (예: team1)"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            style={{
                                padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)',
                                color: 'black', fontSize: '16px', backgroundColor: 'rgba(255,255,255,0.9)',
                                outline: 'none', transition: 'border 0.2s', fontWeight: '600'
                            }}
                            onFocus={e => e.target.style.border = '1px solid #F1B329'}
                            onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.2)'}
                        />
                        <input
                            type="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={{
                                padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)',
                                color: 'black', fontSize: '16px', backgroundColor: 'rgba(255,255,255,0.9)',
                                outline: 'none', transition: 'border 0.2s', fontWeight: '600'
                            }}
                            onFocus={e => e.target.style.border = '1px solid #F1B329'}
                            onBlur={e => e.target.style.border = '1px solid rgba(255,255,255,0.2)'}
                        />
                        <button type="submit" style={{
                            padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#F1B329',
                            color: 'white', fontWeight: '900', fontSize: '18px', cursor: 'pointer',
                            marginTop: '10px', boxShadow: '0 6px 12px rgba(241, 179, 41, 0.4)', transition: 'transform 0.1s'
                        }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            입장하기
                        </button>
                    </form>
                    {error && <p style={{ color: '#ff6b6b', marginTop: '15px', textAlign: 'center', fontWeight: '800', fontSize: '15px' }}>{error}</p>}
                </div>
            </div>
        </div>
    );
}
