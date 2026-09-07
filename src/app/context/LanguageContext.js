'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

const STORAGE_KEY = 'shift_app_lang'

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('fr')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem(STORAGE_KEY)
      if (storedLang && ['fr', 'en'].includes(storedLang)) {
        setLangState(storedLang)
      }
    } catch (error) {
      console.warn('Could not read language from localStorage', error)
    }
    setIsInitialized(true)
  }, [])

  const setLang = (newLang) => {
    if (['fr', 'en'].includes(newLang)) {
      setLangState(newLang)
      try {
        localStorage.setItem(STORAGE_KEY, newLang)
      } catch (error) {
        console.warn('Could not save language to localStorage', error)
      }
    }
  }

  const value = { lang, setLang, isInitialized }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}