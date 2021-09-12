import { Button } from "@chakra-ui/button";
import { Box, Flex, Heading, Link, Stack, Text } from "@chakra-ui/react";
import { withUrqlClient } from 'next-urql';
import NextLink from 'next/link';
import { useState } from "react";
import { EditDeletePostButtons } from '../components/EditDeletePostButtons';
import { Layout } from "../components/Layout";
import { UpdootSection } from '../components/UpdootSection';
import { useDeletePostMutation, useMeQuery, usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";


const Index = () => {
    const [variables, setVariables] = useState({limit: 15, cursor: null as null | string});

    const [{data: meData}] = useMeQuery();

    const [{data, fetching, error}] = usePostsQuery({
        variables,
    });

    const [, deletePost] = useDeletePostMutation();

    if (!fetching && !data) {
    return (
      <div>
        <div>you got query failed for some reason</div>
        <div>{error?.message}</div>
      </div>
    );
  }
    return(
        <Layout>
            
                {/* display all posts if there are posts present and not fetching, */}
              
                {fetching && !data ? (
                    <div>loading...</div>
                ): (
            
                <Stack spacing = {8}>
                0tr
                    {data!.posts.posts.map((p) => !p ? null: ( /* redact null values. */
                    
                        <Flex key = {p.id} p={5} shadow="md" borderWidth="1px">
                            <UpdootSection post = {p}/>
                            <Box ml = '10px' flex = {1} maxW = {800}>
                                <NextLink href = "/post/[id]" as = {`/post/${p.id}`}>
                                    <Link>
                                        <Heading as="h2" fontSize="xl" >{p.title}</Heading>
                                    </Link>
                                </NextLink>
                                <Text>posted by {p.creator.username}</Text>
                                <Flex align = 'center'>
                                    <Text mt={4} flex = {1}>
                                        {p.textSnippet}
                                    </Text>
                                    <Box my = 'auto'> 
                                        <EditDeletePostButtons 
                                            id = {p.id} 
                                            creatorId = {p.creator.id} 
                                         />
                                    </Box>
                                </Flex>      
                            </Box>      
                        </Flex>
                ))}
                </Stack>
            )}
            {data && data.posts.hasMore ?( /* check there is actually more post available. */
                <Flex>
                    <Button 
                    my = {4}
                    onClick = {() => {
                        setVariables({
                            limit: variables.limit,
                            cursor: data.posts.posts[data.posts.posts.length-1].createdAt
                        })
                    }}
                    >
                        Load More
                    </Button>
                </Flex>
            ): null }
        </Layout>
    )
}


/*
    with  ssr:true > server side rendering enabled for this index page

    this means the request are made from the server before the page actually loads

    rather than just making requests from the browser itself.

    page time may take longer to load but when it does, no further request must be made.

    https://formidable.com/open-source/urql/docs/advanced/server-side-rendering/

    server side rendering enables google to pick up the results for SEO.

    only use for when you are performing some kind of query.
*/
export default withUrqlClient(createUrqlClient, {ssr: true})(Index);
