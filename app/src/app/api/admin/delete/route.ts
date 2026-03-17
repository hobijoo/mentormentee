import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { BINGO_ITEMS } from '@/lib/constants';
import type { StoredOption, StoredUploadRow } from '@/lib/types';

export async function POST(req: NextRequest) {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { userId, itemId, optionId, reason } = body;

        if (typeof reason !== 'string' || !reason.trim()) {
            return NextResponse.json({ success: false, message: '삭제 사유를 입력해주세요.' }, { status: 400 });
        }

        const stmt = db.prepare('SELECT id, user_id, item_index, options FROM uploads WHERE user_id = ? AND item_index = ?');
        const upload = stmt.get(userId, itemId) as Pick<StoredUploadRow, 'id' | 'user_id' | 'item_index' | 'options'> | undefined;

        if (!upload) {
            return NextResponse.json({ success: false, message: 'Upload not found' });
        }

        const itemInfo = BINGO_ITEMS.find(i => i.id === itemId);

        if (optionId) {
            // Delete just the option
            let options: StoredOption[] = [];
            try {
                const parsed = JSON.parse(upload.options || '[]');
                options = (Array.isArray(parsed) ? parsed : []).map((o: unknown) => {
                    if (typeof o === 'string') {
                        return { id: o, photoUrl: '' };
                    }
                    const option = typeof o === 'object' && o !== null ? o as Partial<StoredOption> : {};
                    return {
                        id: option.id || '',
                        photoUrl: option.photoUrl || ''
                    };
                }).filter(option => option.id);
            } catch { }

            options = options.filter((o) => o.id !== optionId);

            // Recalculate awarded score
            let newScore = itemInfo?.score || 0;
            if (options.length > 0 && itemInfo && itemInfo.options) {
                options.forEach((o) => {
                    const optInfo = itemInfo.options!.find(io => io.id === o.id);
                    if (optInfo) {
                        newScore += optInfo.score;
                    }
                });
            }

            db.prepare('UPDATE uploads SET options = ?, score_awarded = ? WHERE id = ?')
                .run(JSON.stringify(options), newScore, upload.id);

        } else {
            // Delete entire base mission
            db.prepare('DELETE FROM uploads WHERE id = ?').run(upload.id);
        }

        db.prepare(`
            INSERT INTO deletion_notices (user_id, item_index, option_id, reason)
            VALUES (?, ?, ?, ?)
        `).run(userId, itemId, optionId || null, reason.trim());

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        console.error('Delete error:', e);
        const message = e instanceof Error ? e.message : 'Unknown error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
