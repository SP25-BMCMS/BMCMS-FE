import React, { ReactNode } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { useTranslation } from 'react-i18next'

interface TooltipProps {
  children: ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 300,
}) => {
  const { t } = useTranslation()
  // Convert our position prop to Radix UI's side prop
  const side = position as TooltipPrimitive.TooltipContentProps['side']

  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align="center"
            sideOffset={5}
            className="z-50 px-3 py-2 bg-gray-800 text-white text-xs rounded-md shadow-md max-w-xs break-words"
          >
            {t(content)}
            <TooltipPrimitive.Arrow className="fill-gray-800" width={10} height={5} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export default Tooltip
