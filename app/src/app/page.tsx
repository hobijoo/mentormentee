import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BingoBoard from './BingoBoard';
import { calculateLines, getLineBonus } from '@/lib/constants';
import type { BingoUploadsMap, StoredOption, StoredUploadRow, UserDetails } from '@/lib/types';

export default async function Home() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  if (user.role === 'admin') {
    redirect('/admin');
  }

  const stmt = db.prepare('SELECT item_index, photo_url, score_awarded, options FROM uploads WHERE user_id = ?');
  const userUploads = stmt.all(user.userId) as StoredUploadRow[];

  let initialScore = 0;
  const initialUploads: Record<number, { photoUrl: string, options: StoredOption[], scoreAwarded: number }> = {};
  const uploadsMap: BingoUploadsMap = {};

  for (const row of userUploads) {
    initialScore += row.score_awarded || 0;
    let opt: StoredOption[] = [];
    try {
      const parsed = JSON.parse(row.options || '[]');
      opt = (Array.isArray(parsed) ? parsed : []).map((o: unknown) => {
        const option = typeof o === 'object' && o !== null ? o as Partial<StoredOption> : {};
        return {
          id: typeof o === 'string' ? o : option.id || '',
          photoUrl: option.photoUrl ? option.photoUrl.replace('/uploads/', '/api/file/') : ''
        };
      }).filter(option => option.id);
    } catch { }

    initialUploads[row.item_index] = {
      photoUrl: row.photo_url ? row.photo_url.replace('/uploads/', '/api/file/') : '',
      options: opt,
      scoreAwarded: row.score_awarded
    };
    uploadsMap[row.item_index] = true;
  }

  let lines = 0;
  try { lines = calculateLines(uploadsMap); } catch { }
  initialScore += getLineBonus(lines);

  const userStmt = db.prepare('SELECT username FROM users WHERE id = ?');
  const userDetails = userStmt.get(user.userId) as UserDetails;

  return (
    <BingoBoard
      initialScore={initialScore}
      initialUploads={initialUploads}
      user={userDetails}
    />
  );
}
