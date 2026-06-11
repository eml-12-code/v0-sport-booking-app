"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RefreshOnFocus() {
  const router = useRouter();

  console.log(" [ RefreshOnFocus ] -> :")

  useEffect(() => {
    const onFocus = () => {
      // Tells Next.js to recompute Server Components and update data
      router.refresh(); 
    };

    window.addEventListener("focus", onFocus);
    
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);

  return null;
}




