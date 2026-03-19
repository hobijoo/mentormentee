'use client';

import { useState, useRef, useEffect, useId } from 'react';
import type { UserDetails } from '@/lib/types';
import { BINGO_ITEMS, calculateLines, getLineBonus } from '@/lib/constants';
import { useRouter } from 'next/navigation';

function AutoFitText({ html }: { html: string }) {
    const textRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = textRef.current;
        if (!el || !el.parentElement) return;

        el.style.fontSize = '18px';

        const parent = el.parentElement;
        const pWidth = parent.clientWidth - 20;
        const pHeight = parent.clientHeight - 20;

        let fontSize = 18;
        while ((el.scrollHeight > pHeight || el.scrollWidth > pWidth) && fontSize > 10) {
            fontSize--;
            el.style.fontSize = `${fontSize}px`;
        }
    }, [html]);

    return (
        <span
            ref={textRef}
            dangerouslySetInnerHTML={{ __html: html }}
            style={{
                display: 'inline-block',
                wordBreak: 'keep-all',
                lineHeight: '1.2',
                fontSize: '18px',
                textAlign: 'center'
            }}
        />
    );
}

function FilePicker({
    file,
    onChange,
}: {
    file: File | null;
    onChange: (file: File | null) => void;
}) {
    const inputId = useId();

    return (
        <div className="filePicker">
            <input
                id={inputId}
                type="file"
                accept="image/*"
                onChange={(e) => onChange(e.target.files?.[0] || null)}
                className="filePickerInput"
            />
            <label htmlFor={inputId} className="filePickerButton">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8.5 5.5L10 3.5H14L15.5 5.5H18C19.1 5.5 20 6.4 20 7.5V17.5C20 18.6 19.1 19.5 18 19.5H6C4.9 19.5 4 18.6 4 17.5V7.5C4 6.4 4.9 5.5 6 5.5H8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <span>사진 추가</span>
            </label>
            {file && <div className="filePickerName">{file.name}</div>}
        </div>
    );
}

export interface OptionData {
    id: string;
    photoUrl: string;
}

export interface UploadData {
    photoUrl: string;
    options: OptionData[];
    scoreAwarded: number;
}

interface BingoBoardProps {
    initialScore: number;
    initialUploads: Record<number, UploadData>;
    user: UserDetails;
}

interface ScoreHistoryEntry {
    label: string;
    score: number;
}

const SHEET_CLOSE_DURATION = 240;
const SHEET_CLOSE_THRESHOLD = 120;

export default function BingoBoard({ initialScore, initialUploads, user }: BingoBoardProps) {
    const [score, setScore] = useState(initialScore);
    const [uploads, setUploads] = useState<Record<number, UploadData>>(initialUploads);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [optionFiles, setOptionFiles] = useState<Record<string, File>>({});

    const [showHistory, setShowHistory] = useState(false);
    const [showBingoAnimation, setShowBingoAnimation] = useState<number>(0);
    const [closingSheet, setClosingSheet] = useState<'item' | 'history' | null>(null);
    const [dragSheet, setDragSheet] = useState<'item' | 'history' | null>(null);
    const [sheetOffsetY, setSheetOffsetY] = useState(0);
    const dragStartYRef = useRef(0);
    const closeTimeoutRef = useRef<number | null>(null);

    const uData = selectedItemId !== null ? uploads[selectedItemId] : null;

    const handleItemClick = (id: number) => {
        const existingData = uploads[id];

        if (closeTimeoutRef.current) {
            window.clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setClosingSheet(null);
        setDragSheet(null);
        setSheetOffsetY(0);
        setSelectedItemId(id);
        setSelectedFile(null);
        setSelectedOptions(existingData ? existingData.options.map((option) => option.id) : []);
        setOptionFiles({});
    };

    const openHistorySheet = () => {
        if (closeTimeoutRef.current) {
            window.clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        setClosingSheet(null);
        setDragSheet(null);
        setSheetOffsetY(0);
        setShowHistory(true);
    };

    const finishCloseSheet = (sheet: 'item' | 'history') => {
        if (sheet === 'item') {
            setSelectedItemId(null);
        } else {
            setShowHistory(false);
        }
        setClosingSheet(null);
        setDragSheet(null);
        setSheetOffsetY(0);
    };

    const requestCloseSheet = (sheet: 'item' | 'history') => {
        if (closingSheet === sheet) return;
        setClosingSheet(sheet);
        setDragSheet(null);
        setSheetOffsetY(0);

        if (closeTimeoutRef.current) {
            window.clearTimeout(closeTimeoutRef.current);
        }

        closeTimeoutRef.current = window.setTimeout(() => {
            finishCloseSheet(sheet);
            closeTimeoutRef.current = null;
        }, SHEET_CLOSE_DURATION);
    };

    const beginSheetDrag = (sheet: 'item' | 'history', clientY: number) => {
        if (closingSheet) return;
        setDragSheet(sheet);
        dragStartYRef.current = clientY - sheetOffsetY;
    };

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                window.clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!dragSheet) return;

        const handlePointerMove = (event: PointerEvent) => {
            const nextOffset = Math.max(0, event.clientY - dragStartYRef.current);
            setSheetOffsetY(nextOffset);
        };

        const handlePointerEnd = () => {
            const activeSheet = dragSheet;
            const shouldClose = sheetOffsetY > SHEET_CLOSE_THRESHOLD;

            setDragSheet(null);

            if (shouldClose) {
                requestCloseSheet(activeSheet);
                return;
            }

            setSheetOffsetY(0);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerEnd);
        window.addEventListener('pointercancel', handlePointerEnd);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerEnd);
            window.removeEventListener('pointercancel', handlePointerEnd);
        };
    }, [dragSheet, sheetOffsetY, closingSheet]);

    const toggleOption = (optId: string, isMutuallyExclusiveGroup: boolean = false, groupOptIds: string[] = []) => {
        setSelectedOptions((prev) => {
            let next = [...prev];

            if (next.includes(optId)) {
                next = next.filter((option) => option !== optId);
            } else {
                if (isMutuallyExclusiveGroup) {
                    next = next.filter((option) => !groupOptIds.includes(option));
                }
                next.push(optId);
            }
            return next;
        });

        setOptionFiles((prev) => {
            const next = { ...prev };
            if (isMutuallyExclusiveGroup) {
                groupOptIds.forEach((id) => {
                    if (id !== optId) delete next[id];
                });
            }
            if (prev[optId]) {
                delete next[optId];
            }
            return next;
        });
    };

    const handleOptionFileChange = (optId: string, file: File | null) => {
        if (file) {
            setOptionFiles((prev) => ({ ...prev, [optId]: file }));
        } else {
            setOptionFiles((prev) => {
                const next = { ...prev };
                delete next[optId];
                return next;
            });
        }
    };

    const canSubmit = () => {
        if (!uData && !selectedFile) return false;

        const existingOptIds = uData ? uData.options.map((option) => option.id) : [];
        for (const optId of selectedOptions) {
            if (!existingOptIds.includes(optId) && !optionFiles[optId]) {
                return false;
            }
        }
        return true;
    };

    const handleSubmitUpload = async () => {
        if (selectedItemId === null) return;

        setIsUploading(true);
        const formData = new FormData();
        if (selectedFile) formData.append('file', selectedFile);
        formData.append('itemId', selectedItemId.toString());
        formData.append('options', JSON.stringify(selectedOptions));

        for (const [optId, file] of Object.entries(optionFiles)) {
            formData.append(`file_opt_${optId}`, file);
        }

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                const nextUploads = {
                    ...uploads,
                    [selectedItemId]: {
                        photoUrl: data.photoUrl,
                        options: data.options,
                        scoreAwarded: data.scoreAwarded
                    }
                };

                const oldLines = calculateLines(uploads);
                const newLines = calculateLines(nextUploads);
                if (newLines > oldLines) {
                    setShowBingoAnimation(newLines - oldLines);
                    setTimeout(() => setShowBingoAnimation(0), 3000);
                }

                setUploads(nextUploads);
                setScore(data.newScore);
                requestCloseSheet('item');
            } else {
                alert('업로드 실패: ' + data.message);
            }
        } catch (error) {
            console.error('Upload error', error);
            alert('업로드 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteUpload = async (optionId?: string) => {
        if (selectedItemId === null) return;

        const targetLabel = optionId ? '이 보너스 인증' : '이 미션 인증';
        if (!window.confirm(`${targetLabel}을 삭제할까요?`)) return;

        setIsUploading(true);
        try {
            const res = await fetch('/api/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: selectedItemId, optionId })
            });
            const data = await res.json();

            if (!data.success) {
                alert('삭제 실패: ' + data.message);
                return;
            }

            setUploads(data.uploads);
            setScore(data.newScore);

            if (optionId) {
                const nextUpload = data.uploads[selectedItemId];
                setSelectedOptions(nextUpload ? nextUpload.options.map((option: OptionData) => option.id) : []);
                setOptionFiles({});
                if (!nextUpload) {
                    requestCloseSheet('item');
                }
            } else {
                requestCloseSheet('item');
            }
        } catch (error) {
            console.error('Delete error', error);
            alert('삭제 중 오류가 발생했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const getScoreHistory = () => {
        const history: ScoreHistoryEntry[] = [];

        for (const [idStr, uploadData] of Object.entries(uploads)) {
            const id = Number(idStr);
            const item = BINGO_ITEMS.find((candidate) => candidate.id === id);
            if (!item) continue;

            history.push({ label: item.text.replace(/<[^>]*>/g, ' '), score: item.score });

            if (uploadData.options && item.options) {
                for (const optionData of uploadData.options) {
                    const option = item.options.find((candidate) => candidate.id === optionData.id);
                    if (option) {
                        history.push({ label: `└── ${option.label}`, score: option.score });
                    }
                }
            }
        }

        const lines = calculateLines(uploads);
        const linesBonus = getLineBonus(lines);
        if (linesBonus > 0) {
            history.push({ label: `빙고 총 ${lines}줄 보너스 (줄당 200점)`, score: linesBonus });
        }

        return history;
    };

    const selectedItemInfo = BINGO_ITEMS.find((item) => item.id === selectedItemId);
    const bowlingOptions = ['볼링핀3', '볼링핀4', '볼링핀5'];
    const itemSheetClosing = closingSheet === 'item';
    const historySheetClosing = closingSheet === 'history';

    const getSheetOverlayStyle = (sheet: 'item' | 'history') => {
        if (dragSheet !== sheet && sheetOffsetY === 0) return undefined;

        return {
            opacity: Math.max(0, 1 - sheetOffsetY / 260),
            transition: dragSheet === sheet ? 'none' : 'opacity 0.18s ease'
        };
    };

    const getSheetPanelStyle = (sheet: 'item' | 'history') => {
        if (dragSheet !== sheet && sheetOffsetY === 0) return undefined;

        return {
            transform: `translateY(${sheetOffsetY}px)`,
            transition: dragSheet === sheet ? 'none' as const : 'transform 0.18s ease'
        };
    };

    return (
        <div style={{ position: 'fixed', inset: 0, width: '100%', maxWidth: '430px', height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column', touchAction: 'none', backgroundColor: '#EEE9E7' }}>
            <div className="safeTopInset" />
            <div id="header" style={{ width: '100%', flexShrink: 0 }}>
                <img src="/top.png" alt="Header Banner" style={{ width: '100%', height: 'auto', display: 'block', transform: 'translateZ(0)' }} />
            </div>
            <div id="bingo" style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom)', boxSizing: 'border-box' }}>
                <div id="bingoHeader">
                    <div id="bingoMole"></div>
                    <div
                        id="bingoScore"
                        className="holtwood-one-sc-regular"
                        onClick={openHistorySheet}
                        style={{ cursor: 'pointer' }}
                    >
                        {score}
                    </div>
                </div>
                <div id="bingoBoard">
                    {BINGO_ITEMS.map((item) => {
                        const existingData = uploads[item.id];
                        const hasPhoto = !!existingData;
                        const isMaxed = existingData && (!item.options || existingData.options.length >= item.options.length);

                        return (
                            <div
                                key={item.id}
                                className="bingoBoardItem"
                                onClick={() => handleItemClick(item.id)}
                                style={{
                                    cursor: isMaxed ? 'default' : 'pointer',
                                    backgroundImage: hasPhoto ? `url(${existingData.photoUrl})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundColor: hasPhoto ? 'transparent' : undefined,
                                    border: hasPhoto && !isMaxed ? '5px dashed #F1B329' : '5px solid white'
                                }}
                            >
                                {!hasPhoto && <AutoFitText html={item.text} />}
                                {hasPhoto && !isMaxed && (
                                    <div style={{ backgroundColor: 'rgba(255,255,255,0.8)', padding: '2px 5px', borderRadius: '5px', fontSize: '12px', color: 'black', fontWeight: 'bold' }}>
                                        보너스 추가 가능!
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0 20px 0' }}>
                    <button
                        onClick={() => router.push('/api/logout')}
                        title={`로그아웃 (${user?.username})`}
                        style={{ width: '44px', height: '44px', padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.15)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                    >
                        <img src="/arrow.right.to.line.compact.svg" alt="로그아웃" style={{ width: '100%', height: '100%', opacity: 0.8, filter: 'invert(1) brightness(100)' }} />
                    </button>
                </div>
            </div>

            {selectedItemId !== null && selectedItemInfo && (
                <div
                    className={`sheetOverlay ${itemSheetClosing ? 'isClosing' : ''}`}
                    style={getSheetOverlayStyle('item')}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) requestCloseSheet('item');
                    }}
                >
                    <div className={`sheetPanel ${itemSheetClosing ? 'isClosing' : ''}`} style={getSheetPanelStyle('item')}>
                        <div
                            className="sheetHandle"
                            onPointerDown={(e) => beginSheetDrag('item', e.clientY)}
                        />
                        <div className="sheetTitleRow">
                            <h2 className="sheetTitle" dangerouslySetInnerHTML={{ __html: selectedItemInfo.text.replace(/<br>/g, ' ') }} />
                            <div className="sheetScorePill">+{selectedItemInfo.score}</div>
                        </div>
                        <div className="sheetInfo">
                            {selectedItemInfo.description && (
                                <p className="sheetMuted">{selectedItemInfo.description}</p>
                            )}
                        </div>

                        {!uData && (
                            <div className="sheetCard">
                                <div className="sheetCardHeaderRow">
                                    <strong className="sheetCardTitle">기본 사진 (필수)</strong>
                                    <FilePicker file={selectedFile} onChange={setSelectedFile} />
                                </div>
                            </div>
                        )}
                        {uData && (
                            <div className="sheetDoneBox">
                                <strong>✓ 기본 사진 인증 완료</strong>
                                <button
                                    type="button"
                                    className="sheetDangerButton"
                                    onClick={() => handleDeleteUpload()}
                                    disabled={isUploading}
                                >
                                    삭제
                                </button>
                            </div>
                        )}

                        {selectedItemInfo.options && selectedItemInfo.options.length > 0 && (
                            <div className="sheetOptionGroup">
                                <strong className="sheetOptionTitle">🔥 추가 보너스 미션 (체크 시 사진 필수)</strong>
                                {selectedItemInfo.options.map((option) => {
                                    const isAlreadyDone = uData && uData.options.find((data) => data.id === option.id);
                                    const isChecked = selectedOptions.includes(option.id);
                                    const isOptionDisabled = !!isAlreadyDone;
                                    const isBowlingGroup = bowlingOptions.includes(option.id);

                                    return (
                                        <div key={option.id} className="sheetOptionItem">
                                            <div className="sheetOptionRow">
                                                <label className={`sheetOptionLabel ${isOptionDisabled ? 'isDisabled' : ''}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleOption(option.id, isBowlingGroup, bowlingOptions)}
                                                        disabled={isOptionDisabled}
                                                    />
                                                    <span className="sheetOptionText">
                                                        {option.label}
                                                        {isAlreadyDone && ' ✓'}
                                                    </span>
                                                </label>
                                                <div className="sheetOptionPill">+{option.score}</div>
                                            </div>

                                            {isChecked && !isAlreadyDone && (
                                                <div className="sheetOptionFile">
                                                    <FilePicker
                                                        file={optionFiles[option.id] || null}
                                                        onChange={(file) => handleOptionFileChange(option.id, file)}
                                                    />
                                                </div>
                                            )}

                                            {isAlreadyDone && (
                                                <button
                                                    type="button"
                                                    className="sheetInlineDangerButton"
                                                    onClick={() => handleDeleteUpload(option.id)}
                                                    disabled={isUploading}
                                                >
                                                    삭제
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="sheetActions">
                            <button
                                onClick={handleSubmitUpload}
                                disabled={!canSubmit() || isUploading}
                                className="sheetPrimaryButton"
                            >
                                {isUploading ? '업로드 중...' : '확인'}
                            </button>
                            <button
                                onClick={() => requestCloseSheet('item')}
                                className="sheetSecondaryButton"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showHistory && (
                <div
                    className={`sheetOverlay ${historySheetClosing ? 'isClosing' : ''}`}
                    style={getSheetOverlayStyle('history')}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) requestCloseSheet('history');
                    }}
                >
                    <div className={`sheetPanel ${historySheetClosing ? 'isClosing' : ''}`} style={getSheetPanelStyle('history')}>
                        <div
                            className="sheetHandle"
                            onPointerDown={(e) => beginSheetDrag('history', e.clientY)}
                        />
                        <div className="sheetTitleRow">
                            <h2 className="sheetTitle">점수 내역</h2>
                            <div className="sheetScorePill sheetScorePillTotal">{score}점</div>
                        </div>

                        <div className="historyList">
                            {getScoreHistory().map((item, idx) => (
                                <div key={idx} className="historyRow">
                                    <span className={item.label.includes('└──') ? 'historySub' : 'historyMain'}>
                                        {item.label}
                                    </span>
                                    <span className="historyScore">
                                        +{item.score}점
                                    </span>
                                </div>
                            ))}
                            {getScoreHistory().length === 0 && (
                                <p className="historyEmpty">내역이 없습니다.</p>
                            )}
                        </div>

                        <div className="historySummary">
                            <span>총점</span>
                            <span className="historyTotal">{score}점</span>
                        </div>

                        <button
                            onClick={() => requestCloseSheet('history')}
                            className="sheetPrimaryButton"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}

            {showBingoAnimation > 0 && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh',
                    pointerEvents: 'none', zIndex: 9999, display: 'flex',
                    justifyContent: 'center', alignItems: 'center',
                    flexDirection: 'column',
                    animation: 'bingoFadeIn 0.3s ease-out, bingoFadeOut 1s ease-in 2s forwards'
                }}>
                    <style>{`
                        @keyframes bingoFadeIn {
                            from { opacity: 0; transform: scale(0.5); }
                            to { opacity: 1; transform: scale(1); }
                        }
                        @keyframes bingoFadeOut {
                            from { opacity: 1; }
                            to { opacity: 0; }
                        }
                        @keyframes pulseBingo {
                            0% { transform: scale(1); }
                            50% { transform: scale(1.1); }
                            100% { transform: scale(1); }
                        }
                    `}</style>
                    <div style={{
                        fontSize: '50px', fontWeight: '900', color: '#F1B329',
                        textShadow: '3px 3px 0 #fff, -3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff, 5px 5px 10px rgba(0,0,0,0.5)',
                        animation: 'pulseBingo 0.5s infinite',
                        textAlign: 'center'
                    }}>
                        🎉 BINGO! 🎉
                    </div>
                    <div style={{
                        marginTop: '10px', fontSize: '24px', fontWeight: 'bold', color: 'white',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)', textAlign: 'center'
                    }}>
                        {showBingoAnimation}줄 달성!
                        <br />(+{showBingoAnimation * 200}점 추가)
                    </div>
                </div>
            )}
        </div>
    );
}
