'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { m, AnimatePresence } from 'framer-motion'
import { Mail, User, Phone, Lock, ArrowRight, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import { useLanguage } from '@/app/context/LanguageContext'
import { Translate, fetchTextByKey } from '@/app/calculateur-aides/translation'

const API_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export default function AuthPage() {
  const router = useRouter()
  const { user, checkAuth } = useAuth()
  const { lang } = useLanguage()
  
  useEffect(() => {
    if (user) {
      router.push('/compte')
    }
  }, [user, router])

  const [step, setStep] = useState('EMAIL') // EMAIL, PROFILE, OTP
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  
  const [emailPlaceholder, setEmailPlaceholder] = useState('nom@exemple.fr');
  const [firstNamePlaceholder, setFirstNamePlaceholder] = useState('Prénom');
  const [lastNamePlaceholder, setLastNamePlaceholder] = useState('Nom');
  const [phonePlaceholder, setPhonePlaceholder] = useState('Numéro de téléphone');
  const [otpPlaceholder, setOtpPlaceholder] = useState('Code à 6 chiffres');

  useEffect(() => {
    fetchTextByKey('auth.placeholder.email', lang).then(setEmailPlaceholder);
    fetchTextByKey('auth.placeholder.firstname', lang).then(setFirstNamePlaceholder);
    fetchTextByKey('auth.placeholder.lastname', lang).then(setLastNamePlaceholder);
    fetchTextByKey('auth.placeholder.phone', lang).then(setPhonePlaceholder);
    fetchTextByKey('auth.placeholder.otp', lang).then(setOtpPlaceholder);
  }, [lang]);

  const parseErrorToKey = (errData) => {
    if (!errData) return "auth.error.unexpected"
    
    if (Array.isArray(errData)) {
      return "auth.error.validation"
    }

    const detail = (typeof errData === 'string' ? errData : '').toLowerCase()
    
    if (detail.includes("user not found")) return "auth.error.user_not_found"
    if (detail.includes("email already registered")) return "auth.error.email_registered"
    if (detail.includes("invalid or expired otp")) return "auth.error.otp_invalid"
    if (detail.includes("not found")) return "auth.error.not_found"
    
    return "auth.error.unexpected"
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`${API_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (res.status === 404) {
        setStep('PROFILE')
      } else if (res.ok) {
        setStep('OTP')
      } else {
        const data = await res.json()
        setError(parseErrorToKey(data.detail))
      }
    } catch (err) {
      setError("auth.error.unexpected")
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, first_name: firstName, last_name: lastName, phone })
      })
      
      if (res.ok) {
        setStep('OTP')
      } else {
        const data = await res.json()
        setError(parseErrorToKey(data.detail))
      }
    } catch (err) {
      setError("auth.error.unexpected")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // VERY IMPORTANT FOR COOKIE
        body: JSON.stringify({ email, otp_code: otpCode })
      })
      
      if (res.ok) {
        await checkAuth()
        router.push('/compte')
      } else {
        const data = await res.json()
        setError(parseErrorToKey(data.detail))
      }
    } catch (err) {
      setError("auth.error.unexpected")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'PROFILE') setStep('EMAIL')
    if (step === 'OTP') setStep('EMAIL')
  }

  return (
    <div className="flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] ring-1 ring-slate-900/5 md:p-10">

        {step !== 'EMAIL' && (
          <button 
            onClick={handleBack}
            className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900">
            {step === 'EMAIL' && <Translate id="auth.title.login" />}
            {step === 'PROFILE' && <Translate id="auth.title.register" />}
            {step === 'OTP' && <Translate id="auth.title.verify" />}
          </h1>
          <p className="text-sm font-medium text-slate-500">
            {step === 'EMAIL' && <Translate id="auth.subtitle.login" />}
            {step === 'PROFILE' && <Translate id="auth.subtitle.register" />}
            {step === 'OTP' && <><Translate id="auth.subtitle.verify_part1" /> {email}. <Translate id="auth.subtitle.verify_part2" /></>}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 ring-1 ring-red-500/20">
            <Translate id={error} />
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 'EMAIL' && (
            <m.form
              key="email-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleEmailSubmit}
              className="space-y-4"
            >
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={emailPlaceholder}
                  className="w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 outline-none ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-[#0037FF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0037FF] py-4 text-base font-black text-white shadow-[0_14px_34px_rgba(0,55,255,0.28)] transition-all hover:bg-[#002fdb] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Translate id="auth.btn.continue" />}
                {!loading && <ArrowRight className="h-5 w-5" />}
              </button>
            </m.form>
          )}

          {step === 'PROFILE' && (
            <m.form
              key="profile-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleProfileSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={firstNamePlaceholder}
                    className="w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 outline-none ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-[#0037FF]"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={lastNamePlaceholder}
                    className="w-full rounded-2xl bg-slate-50 py-4 px-4 text-slate-900 placeholder:text-slate-400 outline-none ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-[#0037FF]"
                  />
                </div>
              </div>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Phone className="h-5 w-5" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={phonePlaceholder}
                  className="w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 outline-none ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-[#0037FF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !firstName || !lastName || !phone}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0037FF] py-4 text-base font-black text-white shadow-[0_14px_34px_rgba(0,55,255,0.28)] transition-all hover:bg-[#002fdb] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Translate id="auth.btn.register" />}
                {!loading && <ArrowRight className="h-5 w-5" />}
              </button>
            </m.form>
          )}

          {step === 'OTP' && (
            <m.form
              key="otp-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleOtpSubmit}
              className="space-y-4"
            >
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder={otpPlaceholder}
                  className="w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-4 text-center text-2xl font-bold tracking-[0.2em] text-slate-900 placeholder:text-slate-400 outline-none ring-1 ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-[#0037FF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0037FF] py-4 text-base font-black text-white shadow-[0_14px_34px_rgba(0,55,255,0.28)] transition-all hover:bg-[#002fdb] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Translate id="auth.btn.verify" />}
                {!loading && <ArrowRight className="h-5 w-5" />}
              </button>
            </m.form>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
