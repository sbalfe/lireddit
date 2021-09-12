import { Box } from '@chakra-ui/layout';
import { Button, Flex, Link, Heading } from '@chakra-ui/react';
import React from 'react'
import NextLink from 'next/link'
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';
import {useRouter} from 'next/router'


interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
    const router = useRouter();

    /*
     * hook to execute the specific queries, with a value of fetching status present. 
     */
    const [{fetching: logoutFetching}, logout ] = useLogoutMutation();
    const [{data, fetching}] = useMeQuery({
        /* https://formidable.com/open-source/urql/docs/basics/react-preact/#pausing-usequery */
        pause: isServer() /* dont run the me query if on the server to make more requests than required. */
    });
    let body = null;
    console.log("is this a server", isServer());

  
    // data loading
    if (fetching){
        body = null;

        // user is not logged in, ? = optional
    } else if (!data?.me){
         body =  <>
            {/* uses client side routing this link */}
                <NextLink href = "/login">
                    <Link mr = {2}>login</Link>
                </NextLink>

                <NextLink href = "/register">
                    <Link>register</Link>
                </NextLink>
            </> 
        
        // user is logged in
    } else {
        body = 
            <Flex align = 'center'>
                <NextLink href = "/create-post">
                    <Button as = {Link} mr = {4}>
                        <Link mr ={2} >create-post</Link>
                    </Button>
                </NextLink>     
                <Box>
                    {data.me.username}
                </Box>
                <Button ml = {2} onClick = {async () => {
                    logout();
                    router.reload();
                }}
                isLoading = {logoutFetching}
                variant = "link">logout</Button>
            </Flex>
    }
    return (
        /* z index to make it go underneath the  */
        <Flex  zIndex = {1} position = "sticky" top = {0} bg = "tomato" p = {4} align = 'center'>
            <Flex flex = {1} mx = 'auto' maxW = {800}>
                <NextLink href = "/">
                    <Link>
                        <Heading>liReddit</Heading>
                    </Link>
                </NextLink>
                <Box ml = {'auto'}>
                    {body}
                </Box>
            </Flex>
        </Flex>
    );
}