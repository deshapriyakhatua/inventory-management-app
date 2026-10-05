import { STATUS_COLORS } from "../../allListingsConfig";

export default function StatusDot({ status, size = 8 }) {
    const color = STATUS_COLORS[status?.toLowerCase()]?.dot || '#94a3b8';
    return (
        <span
            style={{
                display: 'inline-block',
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: color,
                flexShrink: 0,
                boxShadow: `0 0 5px ${color}88`,
            }}
        />
    );
}
