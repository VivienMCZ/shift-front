/**
 * Shared inline glass styles — applied via style={{}} to bypass
 * Turbopack/Lightning CSS stripping unprefixed backdrop-filter.
 *
 * Usage:
 *   import { GLASS_SHELL_STYLE, ACTIVE_PLAQUE_STYLE } from '@/app/lib/glass-styles'
 *   <div style={GLASS_SHELL_STYLE}> ... </div>
 */

export const GLASS_SHELL_STYLE = {
  background: 'var(--liquid-bg)',
  border: '1px solid var(--liquid-border)',
  boxShadow: '0 35px 80px -10px rgba(0, 0, 0, 0.25), 0 0 60px 15px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.28)',
  backdropFilter: 'saturate(230%) blur(110px) brightness(70%)',
  WebkitBackdropFilter: 'saturate(230%) blur(110px) brightness(70%)',
}

export const GLASS_INPUT_STYLE = {
  background: 'rgba(8, 16, 36, 0.38)',
  border: '1px solid var(--liquid-border)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px 8px rgba(0, 0, 0, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.20)',
  backdropFilter: 'saturate(230%) blur(110px) brightness(75%)',
  WebkitBackdropFilter: 'saturate(230%) blur(110px) brightness(75%)',
}

export const GLASS_CHIP_STYLE = {
  background: 'rgba(8, 16, 36, 0.22)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  boxShadow: '0 12px 26px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.18)',
  backdropFilter: 'saturate(200%) blur(80px) brightness(85%)',
  WebkitBackdropFilter: 'saturate(200%) blur(80px) brightness(85%)',
}

export const ACTIVE_PLAQUE_STYLE = {
  background: 'var(--shell-sapphire-plaque-bg)',
  border: 'var(--shell-sapphire-plaque-border)',
  boxShadow: 'var(--shell-sapphire-plaque-shadow)',
  backdropFilter: 'blur(16px) saturate(220%) brightness(90%)',
  WebkitBackdropFilter: 'blur(16px) saturate(220%) brightness(90%)',
}
