"use client"

// 🟢 FIXED: Bypasses static prerendering for the sub-page route
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { useState } from "react"
import { useLanguage, type LanguageType } from "@/app/context/language-context"
import { useRouter } from "next/navigation"

export default function LanguageSelectionPage() {
  const { language, setLanguage } = useLanguage()
  const router = useRouter()

  return (
    <section className="px-5 py-4 max-w-md mx-auto text-left flex flex-col items-start">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold">Language / 語言</h2>
      </div>

      <div className="w-full bg-card border border-border rounded-2xl p-4 shadow-sm space-y-2">
        {[
          { id: "en", label: "English" },
          { id: "zh-hans", label: "简体中文" },
          { id: "zh-hant", label: "繁體中文" }
        ].map((lang) => (
          <button
            key={lang.id}
            onClick={() => {
              setLanguage(lang.id as LanguageType)
              router.back()
            }}
            className={`w-full flex items-center justify-between px-4 h-12 rounded-xl text-sm font-semibold transition-all ${
              language === lang.id ? "bg-[#2A52BE] text-white shadow-sm" : "hover:bg-muted"
            }`}
          >
            <span>{lang.label}</span>
            {language === lang.id && <span className="text-xs">✓</span>}
          </button>
        ))}
      </div>
    </section>
  )
}


