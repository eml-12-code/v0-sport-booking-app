"use client"

import { useState, useRef, useTransition, useEffect } from "react"
import { uploadClassSchedule, type UploadResult } from "@/app/actions/admin"

import { getAdminTimetableStream, getUniqueInstructors, getUniqueClassNames, getUniqueLocations } from "@/app/actions/booking"

export function AdminScreen() {
  const [activeSection, setActiveSection] = useState<string>("overview")

  // 🟢 ADDED: State pools for dynamic selection arrays
  const [allClasses, setAllClasses] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [availableNames, setAvailableNames] = useState<string[]>([])
  const [availableInstructors, setAvailableInstructors] = useState<string[]>([])
  const [availableLocations, setAvailableLocations] = useState<string[]>([])

  // 🟢 ADDED: Filter selections state indicators
  const [filterLocation, setFilterLocation] = useState<string>("All")
  const [filterDate, setFilterDate] = useState<string>("")
  const [filterName, setFilterName] = useState<string>("All")          
  const [filterInstructor, setFilterInstructor] = useState<string>("All")


  // ============
   // 3. 🟢 PLACED HERE: The single-source real-time search evaluation engine
  const filteredClasses = allClasses.filter((cls) => {
    const matchLocation = filterLocation === "All" || cls.location === filterLocation
    const matchDate = !filterDate || cls.date === filterDate 
    const matchName = filterName === "All" || cls.name === filterName
    const matchInstructor = filterInstructor === "All" || cls.instructor === filterInstructor

    return matchLocation && matchDate && matchName && matchInstructor
  })

  // 4. 🟢 PLACED HERE: The combined asynchronous parallel loader effect loop
  useEffect(() => {

    async function loadAdminFilterDataPools() {
      try {

        setLoading(true)
        
        // 1. Fetch complete class stream data pool
        try {
          const completeDataPool = await getAdminTimetableStream()
          setAllClasses(completeDataPool || [])
        } catch (e) {
          console.error("❌ [ADMIN HUB] getAdminTimetableStream query failed:", e)
        }

        // 2. Fetch unique class names dropdown data pool
        try {
          const uniqueNames = await getUniqueClassNames()
          setAvailableNames(uniqueNames || [])
        } catch (e) {
          console.error("❌ [ADMIN HUB] getUniqueClassNames query failed:", e)
        }

        // 3. Fetch unique instructor coach names data pool
        try {
          const uniqueLocations = await getUniqueLocations()
          setAvailableLocations(uniqueLocations || [])
        } catch (e) { 
          console.error("❌ [ADMIN HUB] getUniqueLocations query failed:", e)
        }

        // 4. Fetch unique instructor coach names data pool
        try {
          const uniqueInstructors = await getUniqueInstructors()
          setAvailableInstructors(uniqueInstructors || [])
        } catch (e) {
          console.error("❌ [ADMIN HUB] getUniqueInstructors query failed:", e)
        }

      } catch (err) {
        console.error("Failed to build administrative filter lookup datasets:", err)
      } finally {
        setLoading(false)
      }
    }
    loadAdminFilterDataPools()
  }, [])


  // ============


  const menuItems = [
    { id: "overview", label: "Overview", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
    { id: "classes", label: "Upload Classes", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { id: "explore", label: "List Classes", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { id: "bookings", label: "All Bookings", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { id: "members", label: "Members", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { id: "locations", label: "Locations", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" },
    { id: "reports", label: "Reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { id: "scanner", label: "Check-In Scanner", icon: "M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM12 4.5L20.25 12M20.25 4.5L12 12" },
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

      {/* Upload Schedule Section */}
      {activeSection === "scanner" && <HandleDecodeScan onBack={() => setActiveSection("overview")} />}

      {/* ================================================================== */}
      
      {/* 🟢 UPDATED: Passes all dynamic database dropdown filter states straight down into ListScheduleSection */}
      {activeSection === "explore" && (
        <div className="w-full flex flex-col items-start text-left justify-start px-1">
          <ListScheduleSection 
            onBack={() => setActiveSection("overview")} 

            availableLocations={availableLocations} 
            availableNames={availableNames}
            availableInstructors={availableInstructors}
            filteredClasses={filteredClasses}
            filterLocation={filterLocation}
            setFilterLocation={setFilterLocation}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
            filterName={filterName}
            setFilterName={setFilterName}
            filterInstructor={filterInstructor}
            setFilterInstructor={setFilterInstructor}
            loading={loading}
          />
        </div>
      )}
      {/* ================================================================== */}

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
          title="Back to Dashboard"
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
          {['name', 'time', 'date', 'room', 'instructor', 'duration', 'class_size', 'color', 'location'].map((col) => (
            <span
              key={col}
              className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-mono rounded"
            >
              {col}
            </span>
          ))}
          <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-mono rounded">
            token_cost
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


/* ------------------------------------------------------------------ */
/* HandleDecodeScan Sub-Section                                       */
/* ------------------------------------------------------------------ */

// 🟢 FIXED: Capitalized name tells React this is a custom Component piece
function HandleDecodeScan({ onBack }: { onBack: () => void }) {

   // 1. Core State Trackers local to the Scanner Component
  const [scannedInput, setScannedInput] = useState<string>("")
  const [decodedData, setDecodedData] = useState<any>(null)
  const [decodeError, setDecodeError] = useState<string>("")

  // 2. Decryption Engine: Runs inverse client-side Base64 line splits mapping arrays
  const handleDecodeScan = () => {
    try {
      setDecodeError("")
      setDecodedData(null)

      if (!scannedInput.trim()) {
        setDecodeError("Please enter or paste a scanned QR code token string.")
        return
      }

      // Decode base-64 text back into human-readable multi-line strings
      const decodedText = decodeURIComponent(escape(atob(scannedInput.trim())))
      console.log("🔓 [Admin Scanner Terminal] Extracted Payload:\n", decodedText)

      // Map structural text tokens split on newlines straight into a dictionary map
      const lines = decodedText.split("\n")
      const dataMap: Record<string, string> = {}

      lines.forEach((line) => {
        const parts = line.split(": ")
        if (parts.length >= 2) {
          const key = parts[0].trim().toLowerCase()
          const value = parts.slice(1).join(": ").trim()
          dataMap[key] = value
        }
      })

      // Populate layout parameters variables state hooks
      setDecodedData({
        memberId: dataMap["member_id"] || "N/A",
        bookingId: dataMap["booking_id"] || "N/A",
        classId: dataMap["class_id"] || "N/A",
        className: dataMap["name"] || "N/A",
        date: dataMap["date"] || "N/A",
        time: dataMap["time"] || "N/A",
        location: dataMap["location"] || "N/A",
      })

    } catch (err) {
      console.error("Token decoding failed:", err)
      setDecodeError("Invalid QR Token Matrix. This data stream cannot be parsed safely.")
    }
  }


// ---- Return Start  ---

  return (
    <section className="px-5 py-4 pb-28">

      {/* 🟢 MATCHED LAYOUT: Pure horizontal flex grouping button and title together */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
          title="Back to Dashboard"
        >
          <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* 🟢 MATCHED TYPOGRAPHY: Clean, single-line bold header title aligned tightly to the left */}
        <h2 className="text-xl font-bold text-[#212529] tracking-tight leading-none">
          Check-In Scanner
        </h2>
      </div>

      {/* 🟢 FIXED: All related scanner inputs and results layouts wired inside this target card div */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        
        {/* Text Input Block */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Raw Barcode Input Stream
          </h3>
          <textarea
            value={scannedInput}
            onChange={(e) => setScannedInput(e.target.value)}
            placeholder="Paste the raw obfuscated string sequence output copied from the user check-in passes here..."
            className="w-full h-24 p-3 bg-muted/40 border border-border rounded-xl text-xs font-mono focus:outline-none focus:border-primary transition-colors resize-none shadow-inner"
          />
        </div>

        {/* Action Submit Action Button */}
        <button
          onClick={handleDecodeScan}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-extrabold rounded-xl transition-all shadow-sm uppercase tracking-wider"
        >
          Verify Pass Ticket
        </button>

        {/* Error reporting notice sheets blocks */}
        {decodeError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-500 flex items-center gap-2">
            <span>⚠️</span> {decodeError}
          </div>
        )}

        {/* VERIFICATION VERDICT: Decoded passport data display sheet grid */}
        {decodedData && (
          <div className="border-t border-dashed border-border pt-4 mt-2 space-y-3.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pass Verification Ledger</span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider shadow-sm animate-pulse">
                ✓ Valid Entry Ticket
              </span>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 border border-border/40 space-y-3 text-sm font-medium shadow-inner">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground text-xs font-medium">Customer Member ID:</span>
                <span className="font-extrabold text-foreground">👤 {decodedData.memberId}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground text-xs font-medium">Booking reference ID:</span>
                <span className="font-bold text-primary font-mono">{decodedData.bookingId}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground text-xs font-medium">Target Class Index:</span>
                <span className="font-bold text-foreground font-mono">{decodedData.classId}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground text-xs font-medium">Class Event Title:</span>
                <span className="font-extrabold text-foreground uppercase tracking-tight">{decodedData.className}</span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-muted-foreground text-xs font-medium">Schedule Window slot:</span>
                <span className="text-foreground text-xs font-bold bg-background px-2.5 py-1 rounded-lg border border-border/40 shadow-sm">
                  📅 {decodedData.date} • {decodedData.time}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

    </section>  
  )

// ----- Return End -----

}



/* ------------------------------------------------------------------ */
/* HandleListSchedule Sub-Section                                       */
/* ------------------------------------------------------------------ */

interface ListScheduleSectionProps {
  onBack: () => void
  availableLocations: string[]
  availableNames: string[]
  availableInstructors: string[]
  filteredClasses: any[]
  filterLocation: string
  setFilterLocation: (val: string) => void
  filterDate: string
  setFilterDate: (val: string) => void
  filterName: string
  setFilterName: (val: string) => void
  filterInstructor: string
  setFilterInstructor: (val: string) => void
  loading: boolean
}

export function ListScheduleSection({ 
  onBack, 
  availableLocations,
  availableNames, 
  availableInstructors,
  filteredClasses,
  filterLocation,
  setFilterLocation,
  filterDate,
  setFilterDate,
  filterName,
  setFilterName,
  filterInstructor,
  setFilterInstructor,
  loading
}: ListScheduleSectionProps) {


// ------------------------------------------
// 
// ------------------------------------------

  return (

    /* 🟢 ABSOLUTE LEFT ALIGNMENT OVERRIDE CONTAINER */
    <section className="w-full px-5 py-4 pb-28 text-left flex flex-col items-start justify-start animate-fade-in">
      
      {/* Consistent Left-Aligned Header Block matching your Image Reference Layout */}
      <div className="flex items-center justify-start gap-4 mb-6 w-full text-left">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm shrink-0"
          title="Back to Dashboard"
        >
          <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-[#212529] tracking-tight leading-none text-left">
          List Classes
        </h2>
      </div>

      {/* 🟢 THE FILTER CONTROLS HUB BOX CARD */}
      <div className="w-full max-w-4xl bg-card border border-border rounded-xl p-5 shadow-sm text-left mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
        
        {/* Filter 1: Dynamic Location Dropdown Selector */}
        <div className="flex flex-col gap-1.5 text-left items-start w-full">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-0.5">Location</label>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="w-full h-10 px-3 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="All">All Regions</option>
            
            {/* 🟢 FIXED: Dynamic mapping loop replaces old manual layout configuration listings */}
            {availableLocations && availableLocations.length > 0 && availableLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Filter B: Date Picker Calendar */}
        <div className="flex flex-col gap-1.5 text-left items-start w-full">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-0.5">Filter Date</label>
          <input
            type="date"
            // Ensures an empty field defaults to an empty string "" instead of falling back to undefined
            value={filterDate || ""}            
            onChange={(e) => {
              const selectedValue = e.target.value; // Guaranteed by HTML5 spec to be "YYYY-MM-DD"
              
              // 🔬 TRACE LOG: Verifies the exact string structure arriving at your client state engine
              console.log(`📅 [Admin Calendar Input] Selected date value string: "${selectedValue}"`);
              
              setFilterDate(selectedValue);
            }}
            className="w-full h-10 px-3 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
          />
        </div>

        {/* Filter C: Dynamic Class Name Selection Menu */}
        <div className="flex flex-col gap-1.5 text-left items-start w-full">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-0.5">Class Name</label>
          <select
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="w-full h-10 px-3 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="All">All Classes</option>
            {/* 🟢 FIXED: Loop through the availableNames prop passed down from parent */}
            {availableNames && availableNames.length > 0 && availableNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Filter Dß: Dynamic Instructor Selection Menu */}
        <div className="flex flex-col gap-1.5 text-left items-start w-full">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-0.5">Instructor</label>
          <select
            value={filterInstructor}
            onChange={(e) => setFilterInstructor(e.target.value)}
            className="w-full h-10 px-3 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="All">All Instructors</option>
            {/* 🟢 FIXED: Loop through the availableInstructors prop passed down from parent */}
            {availableInstructors && availableInstructors.length > 0 && availableInstructors.map((ins) => (
              <option key={ins} value={ins}>{ins}</option>
            ))}
          </select>
        </div>


      </div>

      {/* 🟢 CLASSES LOG STREAM CARDS CONTAINER */}
      <div className="w-full max-w-4xl space-y-3 text-left">
        {loading ? (
          <div className="flex justify-center py-12 bg-card border border-border rounded-xl w-full">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-xl p-10 text-center text-muted-foreground text-sm font-medium w-full">
            No matching sessions found matching current filter rules.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {filteredClasses.map((cls: any) => (
              <div key={cls.classId} className="relative bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all text-left items-start">
                {/* Left accent ribbon bar */}
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#2A52BE] rounded-l-xl" />
                
                <div className="pl-2 w-full space-y-1">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[9px] font-extrabold text-[#2A52BE] uppercase bg-[#2A52BE]/5 px-2 py-0.5 rounded border border-[#2A52BE]/10">
                      📍 {cls.location}
                    </span>
                    <span className="text-xs font-mono font-bold text-muted-foreground">
                      {cls.classId}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-foreground uppercase tracking-tight pt-1">
                    {cls.name}
                  </h3>

                  <p className="text-xs text-muted-foreground font-semibold">
                    📅 {String(cls.date).split("T")[0]} • 🕒 {cls.time} ({cls.duration} mins)
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-muted mt-2 w-full">
                    <span>👤 Coach: <strong className="text-foreground">{cls.instructor}</strong></span>
                    <span className="font-bold text-foreground">
                      🚪 {cls.room} ({cls.spots}/{cls.classSize} spots)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </section>
  )
}
