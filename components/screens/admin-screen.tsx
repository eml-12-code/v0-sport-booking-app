"use client"

import { useState, useRef, useTransition } from "react"
import { uploadClassSchedule, type UploadResult } from "@/app/actions/admin"

export function AdminScreen() {
  const [activeSection, setActiveSection] = useState<string>("overview")

  const menuItems = [
    { id: "overview", label: "Overview", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
    { id: "classes", label: "Manage Classes", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { id: "bookings", label: "All Bookings", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { id: "members", label: "Members", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { id: "locations", label: "Locations", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" },
    { id: "reports", label: "Reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Status Bar Spacer */}
      <div className="h-12 bg-background" />
      
      {/* Header */}
      <header className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage your fitness center</p>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      {activeSection === "overview" && (
        <section className="px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-primary">156</p>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-green-600">24</p>
              <p className="text-sm text-muted-foreground">Classes Today</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-amber-600">1,234</p>
              <p className="text-sm text-muted-foreground">Active Members</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-blue-600">3</p>
              <p className="text-sm text-muted-foreground">Locations</p>
            </div>
          </div>
        </section>
      )}

      {/* Upload Schedule Section */}
      {activeSection === "classes" && <UploadScheduleSection onBack={() => setActiveSection("overview")} />}

      {/* Menu Items (show when on overview) */}
      {activeSection === "overview" && (
        <section className="px-5 pb-28">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Management
          </h2>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors ${
                  activeSection === item.id
                    ? "bg-primary/10 text-primary"
                    : "bg-card border border-border text-foreground hover:bg-muted"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="font-medium">{item.label}</span>
                <svg className="w-5 h-5 ml-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Upload Schedule Sub-Section                                         */
/* ------------------------------------------------------------------ */

function UploadScheduleSection({ onBack }: { onBack: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<UploadResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setResult(null) // Clear previous result
  }

  const handleUpload = () => {
    if (!selectedFile) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await uploadClassSchedule(formData)
      setResult(res)
      // Clear file input on success
      if (res.success && fileInputRef.current) {
        fileInputRef.current.value = ''
        setSelectedFile(null)
      }
    })
  }

  const handleReset = () => {
    setSelectedFile(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <section className="px-5 py-4 pb-28">
      {/* Sub-header with back button */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-foreground">Upload Class Schedule</h2>
      </div>

      {/* Instructions */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Excel File Format</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Upload an .xlsx, .xls, or .csv file with the following columns:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {['name', 'time', 'date', 'room', 'instructor', 'duration', 'spots', 'color', 'location'].map((col) => (
            <span
              key={col}
              className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-mono rounded"
            >
              {col}
            </span>
          ))}
          <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-mono rounded">
            token_cost (optional)
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Rows are matched by <span className="font-medium text-foreground">date + time + location + room</span>.
          Existing matches are updated; new combinations are inserted with auto-generated IDs.
        </p>
      </div>

      {/* File Input */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <label className="block text-sm font-semibold text-foreground mb-2">Select File</label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
        />
        {selectedFile && (
          <p className="text-xs text-muted-foreground mt-2">
            Selected: <span className="font-medium text-foreground">{selectedFile.name}</span>{' '}
            ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {/* Upload / Reset Buttons */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isPending}
          className="flex-1 py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Uploading...' : 'Upload & Process'}
        </button>
        {(selectedFile || result) && (
          <button
            onClick={handleReset}
            disabled={isPending}
            className="px-4 py-3 rounded-xl font-semibold text-sm bg-card border border-border text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Result Summary */}
      {result && (
        <div className={`rounded-xl p-4 border ${result.success ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'}`}>
          <h3 className={`text-sm font-bold mb-2 ${result.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
            {result.success ? 'Upload Successful' : 'Upload Failed'}
          </h3>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{result.inserted}</p>
              <p className="text-xs text-muted-foreground">Inserted</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{result.updated}</p>
              <p className="text-xs text-muted-foreground">Updated</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{result.total}</p>
              <p className="text-xs text-muted-foreground">Total Rows</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
              <h4 className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                Errors ({result.errors.length})
              </h4>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <li key={i} className="text-xs text-red-600 dark:text-red-400">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
