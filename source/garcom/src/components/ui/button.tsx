import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        rosa:
          "inline-flex cursor-pointer items-center justify-center rounded-full  bg-[#F65C5C] hover:bg-[#E54747] hover:text-[#FFE6E6] transition-all text-white font-semibold font-poppins",
        laranja:
          "inline-flex cursor-pointer items-center justify-center rounded-full  bg-[#FF954A] hover:bg-[#DE9310] text-white hover:text-[#FFE6E6] font-semibold font-poppins",
        branco:
          "inline-flex cursor-pointer items-center justify-center rounded-full  bg-white hover:bg-[#F6E1E1] text-[#F65C5C]  border border-[#F65C5C] font-semibold font-poppins",
        amarelo:
          " inline-flex cursor-pointer items-center justify-center rounded-full  bg-[#FFC300] hover:bg-[#F0B800] text-white hover:text-[#FFF9E6] font-semibold font-poppins ",
        link: "text-[#F65C5C] text-primary underline-offset-4 hover:underline",
        outline:
          "border border-[#F65C5C] bg-white text-[#F65C5C] hover:bg-[#FFF1F1]",
      },
      size: {
        default: "h-[35px] w-fit pl-10 pr-10",
        sm: "h-9 rounded-md px-3",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "rosa",
      size: "default",
    },
  }
)

function Button({ className, variant, size, asChild = false, ...props}: 
  React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }