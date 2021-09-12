import { ChakraProvider, ColorModeProvider, ThemeProvider } from '@chakra-ui/react'
import React from 'react'
import theme from '../theme'
import { AppProps } from 'next/app'

function MyApp({ Component , pageProps}: AppProps) {
  return (
 
    <ThemeProvider theme={theme}>
        <ChakraProvider resetCSS theme={theme}>
          <ColorModeProvider
            options={{
              useSystemColorMode: true,
            }}
          >
            <Component {...pageProps} />
          </ColorModeProvider>
        </ChakraProvider>
    </ThemeProvider>
  )
}

export default MyApp
