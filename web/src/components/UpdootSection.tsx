import React, { useState } from 'react'
import {Flex ,IconButton} from "@chakra-ui/react";
import {ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons'
import { PostSnippetFragment, PostsQuery, useVoteMutation } from '../generated/graphql';

/* obtain all post types from generated. */
interface UpdootSectionProps {
  post: PostSnippetFragment; // use a snippet to create easier types, if we update the graphql it changes here automatically.
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({post}) => {
  /* provide possible types in the useState using typescript for autocompletin */
  const [loadingState, setLoadingState] = useState<'updoot-loading' | 'downdoot-loading' | 'not-loading'>('not-loading');
  /* array where we call the function vote, first is missed , this is just data / status of mutation */
  const [,vote] = useVoteMutation();
  return (
    <Flex direction = 'column' justifyContent = 'center' alignItems = 'center' borderWidth = '1px'>
                          
      <IconButton
        onClick = { async () => {
          if (post.voteStatus === 1){
            return;
          }
          setLoadingState('updoot-loading')
          await vote ({
            postId: post.id,
            value: 1
          })
          setLoadingState('not-loading')
          
        }}
        colorScheme = {post.voteStatus === 1 ? 'green': undefined}
        isLoading = {loadingState === 'updoot-loading'}
        aria-label="updoot post"
        fontSize = "xl"
        icon={<ChevronUpIcon />}
      />
      {post.points}
      <IconButton
      
        onClick = { async () => {
          if (post.voteStatus === -1){
            return;
          }
          setLoadingState('downdoot-loading')
          await vote ({
            postId: post.id,
            value: -1
          })
          setLoadingState('not-loading')
        }}
        colorScheme = {post.voteStatus === -1 ? 'red': undefined}
        isLoading = {loadingState === 'downdoot-loading'}
        aria-label="downdoot post"
        fontSize = "xl"
        icon={<ChevronDownIcon />}
      />
   </Flex>
  );
}

