import { Box } from '@chakra-ui/layout'
import { Flex } from '@chakra-ui/react'
import React from 'react'

export type WrapperVariant = 'small' | 'regular'

interface WrapperProps {
    /* question mark makes it optional */
    variant?: WrapperVariant
}

/* wrap our form we created in register in this box wrapper  */

/* have the ability to choose a size of box depending on the value of the variant props passed in */
export const Wrapper: React.FC<WrapperProps> = ({
        children,
        variant = 'regular'
    }) => {
        return (
            <Box 
                mt = {8} 
                mx = "auto"
                maxW = {variant === 'regular' ? "800px": "400px"} 
                w="100%"
                onClick = {() => console.log("scrolling")}
                
            >
                {children}
            </Box>
        )
}