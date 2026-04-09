"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

export function DatePicker({ selectedDate, onDateSelect }: DatePickerProps) {
  const [startIndex, setStartIndex] = useState(0)
  
  const getDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const dates = getDates()
  const visibleDates = dates.slice(startIndex, startIndex + 7)

  const formatDay = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" })
  }

  const formatDate = (date: Date) => {
    return date.getDate()
  }

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString()
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">
          {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setStartIndex(Math.max(0, startIndex - 1))}
            disabled={startIndex === 0}
            className="p-1.5 rounded-full hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setStartIndex(Math.min(7, startIndex + 1))}
            disabled={startIndex >= 7}
            className="p-1.5 rounded-full hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {visibleDates.map((date, index) => (
          <button
            key={index}
            onClick={() => onDateSelect(date)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[52px] h-[72px] rounded-2xl transition-all duration-200",
              isSelected(date)
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "bg-card hover:bg-secondary border border-border"
            )}
          >
            <span className={cn(
              "text-xs font-medium mb-1",
              isSelected(date) ? "text-primary-foreground/80" : "text-muted-foreground"
            )}>
              {formatDay(date)}
            </span>
            <span className={cn(
              "text-lg font-bold",
              isSelected(date) ? "text-primary-foreground" : "text-foreground"
            )}>
              {formatDate(date)}
            </span>
            {isToday(date) && (
              <div className={cn(
                "w-1.5 h-1.5 rounded-full mt-1",
                isSelected(date) ? "bg-primary-foreground" : "bg-primary"
              )} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
