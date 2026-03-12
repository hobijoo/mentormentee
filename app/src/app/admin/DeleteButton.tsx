'use client';

import { useRouter } from 'next/navigation';

interface DeleteButtonProps {
    userId: number;
    itemId: number;
    optionId?: string;
    isOption: boolean;
}

export default function DeleteButton({ userId, itemId, optionId, isOption }: DeleteButtonProps) {
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm(isOption ? '이 보너스 미션을 삭제하시겠습니까?' : '이 미션(전체)을 삭제하시겠습니까? 관련 보너스도 함께 삭제됩니다.')) {
            return;
        }

        const res = await fetch('/api/admin/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, itemId, optionId })
        });

        if (res.ok) {
            router.refresh();
        } else {
            alert('삭제 실패');
        }
    };

    return (
        <button
            onClick={handleDelete}
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
    );
}
