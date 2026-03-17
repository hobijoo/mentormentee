'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteButtonProps {
    userId: number;
    itemId: number;
    optionId?: string;
    isOption: boolean;
}

export default function DeleteButton({ userId, itemId, optionId, isOption }: DeleteButtonProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!reason.trim()) {
            alert('삭제 사유를 입력해주세요.');
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch('/api/admin/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, itemId, optionId, reason })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || '삭제 실패');
                return;
            }

            setIsOpen(false);
            setReason('');
            router.refresh();
        } catch (error) {
            console.error('Admin delete error', error);
            alert('삭제 중 오류가 발생했습니다.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    padding: '6px 16px',
                    fontSize: '14px',
                    backgroundColor: '#f1f1f5',
                    color: '#ff3b30',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    minWidth: '60px'
                }}
            >
                삭제
            </button>

            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 18, 35, 0.48)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-end',
                        zIndex: 2000,
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={(event) => {
                        if (event.target === event.currentTarget && !isDeleting) {
                            setIsOpen(false);
                        }
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '560px',
                            backgroundColor: '#fff',
                            borderTopLeftRadius: '24px',
                            borderTopRightRadius: '24px',
                            padding: '24px 20px calc(24px + env(safe-area-inset-bottom))',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                            boxShadow: '0 -10px 30px rgba(12, 18, 46, 0.22)'
                        }}
                    >
                        <div style={{ width: '40px', height: '5px', backgroundColor: '#e0e0e0', borderRadius: '999px', margin: '-8px auto 0' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <strong style={{ fontSize: '20px', color: '#1c1c1e' }}>
                                {isOption ? '보너스 미션 삭제' : '미션 삭제'}
                            </strong>
                            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                                삭제 사유는 팀 페이지 상단 알림으로 전달됩니다.
                            </p>
                        </div>

                        <textarea
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="예: 인증 사진 기준이 맞지 않아 삭제되었습니다."
                            rows={4}
                            disabled={isDeleting}
                            style={{
                                width: '100%',
                                borderRadius: '16px',
                                border: '1px solid #dfe3ec',
                                padding: '14px 16px',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                resize: 'none',
                                boxSizing: 'border-box',
                                outline: 'none',
                                backgroundColor: '#fbfcff'
                            }}
                        />

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                style={{
                                    flex: 1,
                                    minHeight: '52px',
                                    border: 'none',
                                    borderRadius: '16px',
                                    backgroundColor: '#ff5a52',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: 900,
                                    opacity: isDeleting ? 0.6 : 1
                                }}
                            >
                                {isDeleting ? '삭제 중...' : '삭제'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                disabled={isDeleting}
                                style={{
                                    flex: 1,
                                    minHeight: '52px',
                                    border: 'none',
                                    borderRadius: '16px',
                                    backgroundColor: '#eef1f6',
                                    color: '#33405f',
                                    fontSize: '16px',
                                    fontWeight: 900
                                }}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
