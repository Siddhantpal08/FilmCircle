import { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';

const ChevronIcon = ({ open }) => (
    <svg
        className={`custom-select-chevron ${open ? 'is-open' : ''}`}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#C0392B"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

/**
 * Custom dropdown replacing native <select>.
 * onChange receives a synthetic event: { target: { name, value } }
 */
export default function CustomSelect({
    value = '',
    onChange,
    options = [],
    placeholder = 'Select…',
    disabled = false,
    className = '',
    name,
    id,
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        const handleOutside = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    const selected = options.find((o) => o.value === value);
    const displayLabel = selected?.label ?? (value ? value : placeholder);
    const isPlaceholder = !selected && (value === '' || value == null);

    const pick = (nextValue) => {
        if (disabled) return;
        onChange?.({ target: { name, value: nextValue } });
        setOpen(false);
    };

    return (
        <div
            ref={rootRef}
            className={`custom-select ${open ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
        >
            <button
                type="button"
                id={id}
                className="custom-select-trigger"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => !disabled && setOpen((o) => !o)}
            >
                <span className={isPlaceholder ? 'custom-select-placeholder' : 'custom-select-value'}>
                    {displayLabel}
                </span>
                <ChevronIcon open={open} />
            </button>
            <ul className="custom-select-menu" role="listbox" aria-hidden={!open}>
                {options.map((opt) => (
                    <li
                        key={opt.value === '' ? '__empty' : opt.value}
                        role="option"
                        aria-selected={value === opt.value}
                        className={`custom-select-option ${value === opt.value ? 'is-selected' : ''}`}
                        onClick={() => pick(opt.value)}
                    >
                        {opt.label}
                    </li>
                ))}
            </ul>
            {name ? <input type="hidden" name={name} value={value} readOnly /> : null}
        </div>
    );
}
