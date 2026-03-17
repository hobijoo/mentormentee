import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { BINGO_ITEMS, calculateLines, getLineBonus } from '@/lib/constants';
import type { BingoUploadsMap, StoredOption, StoredUploadRow } from '@/lib/types';

export async function POST(req: NextRequest) {
    const user = await getSessionUser();
    if (!user) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { itemId, optionId } = body as { itemId?: number; optionId?: string };

        if (typeof itemId !== 'number') {
            return NextResponse.json({ success: false, message: 'Invalid item id' }, { status: 400 });
        }

        const stmt = db.prepare('SELECT id, user_id, item_index, options FROM uploads WHERE user_id = ? AND item_index = ?');
        const upload = stmt.get(user.userId, itemId) as Pick<StoredUploadRow, 'id' | 'user_id' | 'item_index' | 'options'> | undefined;

        if (!upload) {
            return NextResponse.json({ success: false, message: 'Upload not found' }, { status: 404 });
        }

        const itemInfo = BINGO_ITEMS.find((item) => item.id === itemId);

        if (optionId) {
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
                }).filter((option) => option.id);
            } catch { }

            options = options.filter((option) => option.id !== optionId);

            let newScoreForItem = itemInfo?.score || 0;
            if (itemInfo?.options) {
                options.forEach((option) => {
                    const optionInfo = itemInfo.options?.find((candidate) => candidate.id === option.id);
                    if (optionInfo) {
                        newScoreForItem += optionInfo.score;
                    }
                });
            }

            db.prepare('UPDATE uploads SET options = ?, score_awarded = ? WHERE id = ?')
                .run(JSON.stringify(options), newScoreForItem, upload.id);
        } else {
            db.prepare('DELETE FROM uploads WHERE id = ?').run(upload.id);
        }

        const uploadsStmt = db.prepare('SELECT item_index, photo_url, score_awarded, options FROM uploads WHERE user_id = ?');
        const userUploads = uploadsStmt.all(user.userId) as StoredUploadRow[];

        const uploadsMap: BingoUploadsMap = {};
        const nextUploads: Record<number, { photoUrl: string; options: StoredOption[]; scoreAwarded: number }> = {};
        let totalScore = 0;

        for (const row of userUploads) {
            totalScore += row.score_awarded || 0;
            uploadsMap[row.item_index] = true;

            let options: StoredOption[] = [];
            try {
                const parsed = JSON.parse(row.options || '[]');
                options = (Array.isArray(parsed) ? parsed : []).map((o: unknown) => {
                    const option = typeof o === 'object' && o !== null ? o as Partial<StoredOption> : {};
                    return {
                        id: typeof o === 'string' ? o : option.id || '',
                        photoUrl: option.photoUrl ? option.photoUrl.replace('/uploads/', '/api/file/') : ''
                    };
                }).filter((option) => option.id);
            } catch { }

            nextUploads[row.item_index] = {
                photoUrl: row.photo_url ? row.photo_url.replace('/uploads/', '/api/file/') : '',
                options,
                scoreAwarded: row.score_awarded
            };
        }

        const lines = calculateLines(uploadsMap);
        totalScore += getLineBonus(lines);

        return NextResponse.json({
            success: true,
            newScore: totalScore,
            uploads: nextUploads
        });
    } catch (error: unknown) {
        console.error('Delete error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
