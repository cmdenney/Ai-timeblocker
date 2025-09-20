import * as React from "react"
import { cn } from "@/lib/utils"

export interface SearchProps extends React.SVGAttributes<SVGElement> {}

const Search = React.forwardRef<SVGSVGElement, SearchProps>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      className={cn("h-4 w-4", className)}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
)
Search.displayName = "Search"

export { Search }
