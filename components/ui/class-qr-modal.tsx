"use client"


import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"


interface ClassQrModalProps {
  isOpen: boolean
  onClose: () => void
  classInfo: {
    bookingId?: string // 🟢 FIXED: Added tracking property to support history entries
    memberId: number
    classId: string
    className: string
    date: string
    time: string
    location: string
    room: string
  }
}

export function ClassQrModal({ isOpen, onClose, classInfo }: ClassQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("")

  // 🟢 FIXED: Moved inside the component scope so classInfo can be safely read!
  const formattedCode = classInfo.bookingId && classInfo.bookingId !== "undefined"
    ? `BC/${classInfo.date.replace(/-/g, "").slice(2)}/${classInfo.bookingId} • CL/${classInfo.classId}`
    : `CL/${classInfo.classId}`;

  
useEffect(() => {
    if (!isOpen) return

    const currentUserId = classInfo.memberId && classInfo.memberId !== 0 
      ? String(classInfo.memberId) 
      : "1"

    const currentBookingId = classInfo.bookingId && classInfo.bookingId !== "undefined"
      ? String(classInfo.bookingId)
      : "N/A"

    // 1. Compile raw legible text data mapping array fields
    const rawPayloadText = [
      `MEMBER_ID: ${currentUserId}`,
      `CLASS_ID: ${classInfo.classId}`,
      `BOOKING_ID: ${currentBookingId}`,
      `NAME: ${classInfo.className}`,
      `DATE: ${classInfo.date}`,
      `TIME: ${classInfo.time}`,
      `LOCATION: ${classInfo.location} - ${classInfo.room}`
    ].join("\n")

    const securePayload = btoa(unescape(encodeURIComponent(rawPayloadText)))
    console.log("⚡ [QR GENERATOR PAYLOAD] Raw Data:\n", rawPayloadText)
    console.log("🔒 [QR GENERATOR PAYLOAD] Masked Base-64 String Matrix Token:\n", securePayload)

    QRCode.toDataURL(securePayload, { 
      width: 400, 
      margin: 1, 
      errorCorrectionLevel: "H" // Allows center logo overlay coverage footprint
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR formatting failed:", err))

  }, [isOpen, classInfo])


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Custom passport framing styles matching phone screenshot specs exactly */}
      <DialogContent className="max-w-[340px] rounded-[32px] p-6 bg-white border-none shadow-2xl flex flex-col items-center gap-0 select-none !outline-none sm:rounded-[32px]">
        
        {/* Accessible semantic content labels required by Radix UI primitive framework */}
        <DialogTitle className="sr-only">Check-In Passport</DialogTitle>
        <DialogDescription className="sr-only">Display scannable validation tags matrix</DialogDescription>

        {/* 1. Header Metadata Registry Descriptor String */}
        <div className="text-center mt-3 mb-5 space-y-1">
          <p className="text-sm font-bold text-[#6C757D] tracking-wide font-mono">
            {formattedCode}
          </p>
          <p className="text-sm font-semibold text-[#868E96]">
            Scan this code for check-in
          </p>
        </div>

        {/* 2. QR Code Scanner View Surface Frame Container */}
        <div className="relative w-64 h-64 bg-white rounded-2xl p-2 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#E9ECEF] flex items-center justify-center overflow-hidden">
          
          {qrDataUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* The Actual Core QR Matrix Grid */}
              <img src={qrDataUrl} alt="Check-In Token Matrix" className="w-full h-full object-contain" />
              
              {/* Centered Branding Image Logo Box Overlay */}
              <div className="absolute inset-0 m-auto w-12 h-12 bg-[#1A3A9E] border-2 border-white rounded-xl shadow-md flex items-center justify-center p-1 z-10">
                <img src="/logo.png" alt="Air Fitness Logo" className="w-full h-full object-contain select-none" />
              </div>

              {/* ANIMATED LASER LINE: Horizontal scrolling scan line helper */}
              <div className="absolute left-0 right-0 h-[2px] bg-[#2A52BE] shadow-[0_0_12px_#2A52BE] animate-scan" />
            </div>
          ) : (
            <div className="w-full h-full bg-muted animate-pulse rounded-xl" />
          )}
        </div>

        {/* 3. Footer Dismissal Action CTA Trigger Button */}
        <button
          onClick={onClose}
          className="w-full mt-8 h-12 bg-[#2A52BE] hover:bg-[#1A3A9E] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl transition-all shadow-[0_4px_16px_rgba(42,82,190,0.25)] uppercase tracking-wider"
        >
          Close
        </button>

      </DialogContent>
    </Dialog>
  )
}


