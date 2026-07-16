import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { forwardRef } from 'react'

interface Option { value: string; label: string }

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  style?: React.CSSProperties
  className?: string
  id?: string
}

export default function CustomSelect({ value, onChange, options, placeholder = 'Select…', style, className, id }: CustomSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger
        id={id}
        className={className}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '0.5rem', padding: '0.75rem 1rem', width: '100%',
          background: 'var(--bg-glass)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
          fontSize: '0.9375rem', fontFamily: 'inherit', cursor: 'pointer',
          outline: 'none', transition: 'all 0.2s ease', ...style
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,106,247,0.15)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
      >
        <Select.Value placeholder={<span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>} />
        <Select.Icon><ChevronDown size={15} color="var(--text-muted)" /></Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '0.375rem',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)', zIndex: 9999,
            minWidth: 180, maxHeight: 320, overflowY: 'auto',
            animation: 'slideUp 0.15s cubic-bezier(0.4,0,0.2,1)',
          }}
          position="popper" sideOffset={6}
        >
          <Select.ScrollUpButton style={{ display:'flex',justifyContent:'center',color:'var(--text-muted)',padding:'4px' }}>
            <ChevronUp size={14}/>
          </Select.ScrollUpButton>
          <Select.Viewport>
            {options.map(opt => (
              <Select.Item
                key={opt.value} value={opt.value}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem', borderRadius: 8, cursor: 'pointer',
                  fontSize: '0.9375rem', color: 'var(--text-primary)', outline: 'none',
                  transition: 'background 0.15s',
                  userSelect: 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,106,247,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator><Check size={14} color="var(--accent-primary)" /></Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton style={{ display:'flex',justifyContent:'center',color:'var(--text-muted)',padding:'4px' }}>
            <ChevronDown size={14}/>
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
