import { ChakraProvider, ColorModeScript } from "@chakra-ui/react"
import { ReactNode } from "react"
import { theme } from "../../theme"

interface ProviderProps {
  children: ReactNode
}

export function Provider({ children }: ProviderProps) {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} type="localStorage" />
      <ChakraProvider theme={theme} toastOptions={{ defaultOptions: { position: 'top-right' } }}>
        {children}
      </ChakraProvider>
    </>
  )
}