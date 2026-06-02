import { NextResponse } from 'next/server'
import { testLuaBookingEngine } from '../../actions/booking' // adjust path to booking.ts

export async function GET() {
  
  // Triggers a normal booking flow test scenario
  const normalTest = await testLuaBookingEngine('user_john', 'yoga_101', 'normal')
  
  // Triggers a waitlist fallback path test scenario
  const waitlistTest = await testLuaBookingEngine('user_mary', 'spin_202', 'waitlist')

  return NextResponse.json({ normalTest, waitlistTest })
}


