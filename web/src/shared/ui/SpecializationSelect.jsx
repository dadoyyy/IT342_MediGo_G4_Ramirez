import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, Stethoscope, X } from 'lucide-react';
import MEDICAL_SPECIALIZATIONS from '../constants/medicalSpecializations';

/**
 * Searchable multi-select dropdown for medical specializations.
 *
 * Props:
 *  - value       (string[])  — currently selected specializations
 *  - onChange     (fn)        — called with the updated array
 *  - error       (boolean)   — if true, highlight border red
 *  - placeholder (string)    — placeholder text when nothing selected
 */
export default function SpecializationSelect({
  value = [],
  onChange,
  error = false,
  disabled = false,
  placeholder = 'Select specializations',
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  // Normalise: accept legacy string value
  const selected = Array.isArray(value)
    ? value
    : value
      ? value.split(',').map(s => s.trim()).filter(Boolean)
      : [];

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus search when opening
  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const filtered = search.trim()
    ? MEDICAL_SPECIALIZATIONS.filter(s =>
        s.toLowerCase().includes(search.toLowerCase()),
      )
    : MEDICAL_SPECIALIZATIONS;

  function toggle(spec) {
    const next = selected.includes(spec)
      ? selected.filter(s => s !== spec)
      : [...selected, spec];
    onChange(next);
  }

  function remove(spec, e) {
    e?.stopPropagation();
    onChange(selected.filter(s => s !== spec));
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { if (!disabled) setOpen(o => !o); }}
        className={`mg-input ${error ? 'error' : ''}`}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 44,
          paddingRight: 14,
          textAlign: 'left',
          width: '100%',
          minHeight: 44,
          height: 'auto',
          flexWrap: 'wrap',
          color: selected.length > 0 ? '#2B2D42' : 'rgba(141,153,174,0.7)',
          background: disabled ? 'rgba(141,153,174,0.08)' : undefined,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.8 : 1,
        }}
      >
        <Stethoscope
          size={15}
          style={{
            position: 'absolute',
            left: 16,
            top: selected.length > 1 ? 14 : '50%',
            transform: selected.length > 1 ? 'none' : 'translateY(-50%)',
            color: 'rgba(141,153,174,0.6)',
          }}
        />

        {selected.length === 0 ? (
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {placeholder}
          </span>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, flex: 1 }}>
            {selected.map(spec => (
              <span
                key={spec}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px 3px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'rgba(239,35,60,0.12)',
                  border: '1px solid rgba(239,35,60,0.25)',
                  color: '#EF233C',
                  lineHeight: 1.3,
                }}
              >
                {spec}
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => remove(spec, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: 'rgba(239,35,60,0.12)',
                    transition: 'background 0.15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,35,60,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,35,60,0.12)'}
                >
                  <X size={8} />
                </span>
              </span>
            ))}
          </div>
        )}

        <ChevronDown
          size={14}
          style={{
            color: 'rgba(141,153,174,0.7)',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'none',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Dropdown */}
      {open && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: '#FFFFFF',
            border: '1px solid rgba(43,45,66,0.1)',
            borderRadius: 14,
            boxShadow: '0 16px 48px rgba(0,0,0,0.08), 0 0 24px rgba(239,35,60,0.08)',
            overflow: 'hidden',
            animation: 'fadeSlideDown 0.18s ease',
          }}
        >
          {/* Search bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderBottom: '1px solid rgba(43,45,66,0.08)',
            }}
          >
            <Search size={13} style={{ color: 'rgba(141,153,174,0.7)', flexShrink: 0 }} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search specializations…"
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#2B2D42',
                fontSize: 13,
                padding: 0,
              }}
            />
            {selected.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#2EC4B6', padding: '2px 7px', borderRadius: 99, background: 'rgba(46,196,182,0.12)', flexShrink: 0 }}>
                {selected.length} selected
              </span>
            )}
          </div>

          {/* Options */}
          <div
            style={{
              maxHeight: 260,
              overflowY: 'auto',
              padding: '4px 0',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(141,153,174,0.3) transparent',
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: '16px 14px',
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'rgba(141,153,174,0.7)',
                }}
              >
                No specializations found
              </div>
            ) : (
              filtered.map(spec => {
                const isSelected = selected.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggle(spec)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '9px 14px',
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? '#EF233C' : '#2B2D42',
                      background: isSelected
                        ? 'rgba(239,35,60,0.08)'
                        : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(43,45,66,0.04)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = isSelected
                        ? 'rgba(239,35,60,0.08)'
                        : 'transparent';
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: isSelected
                          ? 'rgba(239,35,60,0.15)'
                          : 'rgba(43,45,66,0.05)',
                        border: `1px solid ${isSelected ? 'rgba(239,35,60,0.3)' : 'rgba(43,45,66,0.08)'}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      {isSelected && <Check size={10} style={{ color: '#EF233C' }} />}
                    </div>
                    <span>{spec}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Animation keyframes injected once */}
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
