import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { BINGO_ITEMS } from '@/lib/constants';

export async function POST(req: NextRequest) {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { userId, itemId, optionId } = body;

        const stmt = db.prepare('SELECT id, user_id, item_index, options FROM uploads WHERE user_id = ? AND item_index = ?');
        const upload = stmt.get(userId, itemId) as any;

        if (!upload) {
            return NextResponse.json({ success: false, message: 'Upload not found' });
        }

        const itemInfo = BINGO_ITEMS.find(i => i.id === itemId);

        if (optionId) {
            // Delete just the option
            let options = [];
            try { options = JSON.parse(upload.options || '[]'); } catch (e) { }

            options = options.filter((o: any) => o.id !== optionId);

            // Recalculate awarded score
            let newScore = itemInfo?.score || 0;
            if (options.length > 0 && itemInfo && itemInfo.options) {
                options.forEach((o: any) => {
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

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('Delete error:', e);
        return NextResponse.json({ success: false, message: e.message }, { status: 500 });
    }
}
