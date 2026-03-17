interface RetroHeaderProps {
    eyebrow: string;
    title: string;
    subtitle?: string;
    compact?: boolean;
    englishTitle?: string;
}

export default function RetroHeader({
    eyebrow,
    title,
    subtitle,
    compact = false,
    englishTitle = 'MENTOR-MENTEE',
}: RetroHeaderProps) {
    return (
        <div className={`retroHeader ${compact ? 'isCompact' : ''}`}>
            <div className="retroHeaderTopBar">{eyebrow}</div>
            <div className="retroHeaderPanel">
                {englishTitle && <div className="retroHeaderTitleEn">{englishTitle}</div>}
                <div className="retroHeaderTitle">{title}</div>
                {subtitle && <div className="retroHeaderSubtitle">{subtitle}</div>}
            </div>
            <div className="retroHeaderBands" aria-hidden="true"></div>
        </div>
    );
}
