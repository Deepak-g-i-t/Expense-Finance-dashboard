import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isSameDay, isToday, isBefore, isAfter, parseISO
} from 'date-fns'

interface DatePickerProps {
  value: string          // 'yyyy-MM-dd'
  onChange: (value: string) => void
  placeholder?: string
  minDate?: string
  maxDate?: string
  style?: React.CSSProperties
  id?: string
}

export default function DatePicker({ value, onChange, placeholder = 'Select date', minDate, maxDate, style, id }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(value ? parseISO(value) : new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = value ? parseISO(value) : null
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = getDay(monthStart)
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const isDisabled = (d: Date) => {
    if (minDate && isBefore(d, parseISO(minDate))) return true
    if (maxDate && isAfter(d, parseISO(maxDate))) return true
    return false
  }

  const handleSelect = (d: Date) => {
    if (isDisabled(d)) return
    onChange(format(d, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '0.5rem', padding: '0.75rem 1rem',
          background: 'var(--bg-glass)', border: `1px solid ${open ? 'var(--accent-primary)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: '0.9375rem', fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
          boxShadow: open ? '0 0 0 3px rgba(124,106,247,0.15)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <span>{value ? format(parseISO(value), 'MMM d, yyyy') : placeholder}</span>
        <Calendar size={15} color="var(--text-muted)" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 9999,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '1rem',
              boxShadow: '0 16px 50px rgba(0,0,0,0.6)',
              minWidth: 280,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <button type="button" onClick={() => setViewDate(subMonths(viewDate, 1))} style={navBtn}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                {format(viewDate, 'MMMM yyyy')}
              </span>
              <button type="button" onClick={() => setViewDate(addMonths(viewDate, 1))} style={navBtn}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day names */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '4px' }}>
              {dayNames.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
              {Array.from({ length: startPadding }).map((_, i) => <div key={`e${i}`} />)}
              {days.map(day => {
                const isSelected = selected && isSameDay(day, selected)
                const todayDay = isToday(day)
                const disabled = isDisabled(day)
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelect(day)}
                    style={{
                      width: '100%', aspectRatio: '1', borderRadius: 8, border: 'none',
                      background: isSelected ? 'var(--accent-primary)' : todayDay ? 'rgba(124,106,247,0.15)' : 'transparent',
                      color: isSelected ? 'white' : disabled ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: '0.875rem', fontWeight: isSelected ? 700 : todayDay ? 600 : 400,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      outline: todayDay && !isSelected ? '1px solid rgba(124,106,247,0.5)' : 'none',
                      transition: 'all 0.15s ease',
                      opacity: disabled ? 0.4 : 1,
                    }}
                    onMouseEnter={e => { if (!isSelected && !disabled) e.currentTarget.style.background = 'rgba(124,106,247,0.1)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = todayDay ? 'rgba(124,106,247,0.15)' : 'transparent' }}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>

            {/* Today shortcut */}
            <button
              type="button"
              onClick={() => { handleSelect(new Date()); setViewDate(new Date()) }}
              style={{ marginTop: '0.75rem', width: '100%', padding: '0.5rem', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--accent-primary)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Today
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text-primary)', cursor: 'pointer',
}
