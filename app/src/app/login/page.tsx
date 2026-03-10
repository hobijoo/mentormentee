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
            router.refresh(); // Refresh the page so server components reload
        } else {
            setError(data.message || '로그인 실패');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', backgroundColor: '#20317E', color: 'white' }}>
            {/* Header Area using top.svg */}
            <div id="header" style={{ width: '100%', marginTop: 0, backgroundImage: "url('/top.svg')", backgroundSize: 'cover', backgroundPosition: 'center', aspectRatio: '612/279' }}></div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '20px' }}>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '30px', borderRadius: '20px', backdropFilter: 'blur(10px)', width: '100%', maxWidth: '350px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '24px', letterSpacing: '1px' }}>팀 로그인</h2>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input
                            type="text"
                            placeholder="팀명 (예: team1)"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            style={{ padding: '15px', borderRadius: '12px', border: 'none', color: 'black', fontSize: '16px', backgroundColor: '#f9f9f9', outline: 'none' }}
                        />
                        <input
                            type="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={{ padding: '15px', borderRadius: '12px', border: 'none', color: 'black', fontSize: '16px', backgroundColor: '#f9f9f9', outline: 'none' }}
                        />
                        <button type="submit" style={{ padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: '#F1B329', color: 'white', fontWeight: '800', fontSize: '18px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 6px rgba(241, 179, 41, 0.4)' }}>
                            시작하기
                        </button>
                    </form>
                    {error && <p style={{ color: '#ff6b6b', marginTop: '15px', textAlign: 'center', fontWeight: 'bold' }}>{error}</p>}
                </div>
            </div>
        </div>
    );
}
