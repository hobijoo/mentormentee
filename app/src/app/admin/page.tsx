import db from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BINGO_ITEMS, calculateLines, getLineBonus } from '@/lib/constants';
import DeleteButton from './DeleteButton';

export default async function AdminDashboard() {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
        redirect('/');
    }

    const usersStmt = db.prepare("SELECT id, username FROM users WHERE role = 'user' ORDER BY id ASC");
    const teams = usersStmt.all() as { id: number, username: string }[];

    const uploadsStmt = db.prepare('SELECT user_id, item_index, photo_url, score_awarded, options FROM uploads');
    const allUploads = uploadsStmt.all() as { user_id: number, item_index: number, photo_url: string, score_awarded: number, options: string }[];

    const teamData = teams.map(team => {
        const teamUploads = allUploads.filter(u => u.user_id === team.id);

        let totalScore = 0;
        const uploadsMap: any = {};

        teamUploads.forEach(u => {
            totalScore += u.score_awarded || 0;
            uploadsMap[u.item_index] = true;
        });

        const lines = calculateLines(uploadsMap);
        totalScore += getLineBonus(lines);

        return { ...team, uploads: teamUploads, lines, totalScore };
    });

    teamData.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return b.lines - a.lines;
    });

    return (
        <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh', color: '#333', fontFamily: '"SUITE", sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>관리자 대시보드</h1>
                <a href="/api/logout" title="로그아웃" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#20317E', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                    <img src="/arrow.right.to.line.compact.svg" alt="로그아웃" style={{ width: '20px', height: '20px', filter: 'invert(1) brightness(100)' }} />
                </a>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {teamData.map((team, index) => {
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위 -`;
                    return (
                        <div key={team.id} style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                            <h2 style={{ fontSize: '22px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{medal} {team.username}</span>
                                <span style={{ fontSize: '15px', color: '#666', fontWeight: 'normal' }}>(총점: <strong>{team.totalScore}</strong>점 / 빙고 {team.lines}줄)</span>
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {team.uploads.map(u => {
                                    const bingoItem = BINGO_ITEMS.find(b => b.id === u.item_index);
                                    let opts: { id: string, photoUrl: string }[] = [];
                                    try {
                                        const parsed = JSON.parse(u.options || '[]');
                                        opts = parsed.map((o: any) => typeof o === 'string' ? { id: o, photoUrl: '' } : o);
                                    } catch (e) { }

                                    return (
                                        <div key={u.item_index} style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px', marginBottom: '8px' }}>
                                            {/* Base Mission */}
                                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '12px 0' }}>
                                                {/* App Icon (Photo) */}
                                                <div
                                                    style={{
                                                        width: '64px', height: '64px',
                                                        backgroundImage: `url(${u.photo_url})`,
                                                        backgroundSize: 'cover', backgroundPosition: 'center',
                                                        borderRadius: '14px', border: '1px solid #e5e5ea',
                                                        marginRight: '16px', flexShrink: 0
                                                    }}
                                                />
                                                {/* App Info */}
                                                <div style={{ flex: 1, minWidth: 0, marginRight: '16px' }}>
                                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1c1c1e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                                                        <span dangerouslySetInnerHTML={{ __html: bingoItem?.text.replace(/<br>/g, ' ') || `아이템 ${u.item_index}` }} />
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: '#8e8e93', fontWeight: '500' }}>
                                                        기본 성공 (+{bingoItem?.score || u.score_awarded}점)
                                                    </div>
                                                </div>
                                                {/* Action Button */}
                                                <div style={{ flexShrink: 0 }}>
                                                    <DeleteButton userId={team.id} itemId={u.item_index} isOption={false} />
                                                </div>
                                            </div>

                                            {/* Bonus Missions */}
                                            {opts.length > 0 && bingoItem && bingoItem.options && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0', paddingLeft: '80px', marginTop: '-4px' }}>
                                                    {opts.map(optObj => {
                                                        const oInfo = bingoItem.options?.find(o => o.id === optObj.id);
                                                        return (
                                                            <div key={optObj.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #f2f2f7' }}>
                                                                {optObj.photoUrl && (
                                                                    <div
                                                                        style={{
                                                                            width: '40px', height: '40px',
                                                                            backgroundImage: `url(${optObj.photoUrl})`,
                                                                            backgroundSize: 'cover', backgroundPosition: 'center',
                                                                            borderRadius: '8px', border: '1px solid #e5e5ea',
                                                                            marginRight: '12px', flexShrink: 0
                                                                        }}
                                                                    />
                                                                )}
                                                                {!optObj.photoUrl && (
                                                                    <div style={{ width: '40px', height: '40px', backgroundColor: '#f2f2f7', borderRadius: '8px', marginRight: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8e8e93', fontSize: '10px' }}>No IMG</div>
                                                                )}
                                                                <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                                                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1c1c1e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                                                                        {oInfo ? oInfo.label : optObj.id}
                                                                    </div>
                                                                    <div style={{ fontSize: '12px', color: '#8e8e93', fontWeight: '500' }}>
                                                                        추가 보너스 (+{oInfo?.score || 0}점)
                                                                    </div>
                                                                </div>
                                                                <div style={{ flexShrink: 0 }}>
                                                                    <DeleteButton userId={team.id} itemId={u.item_index} optionId={optObj.id} isOption={true} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
