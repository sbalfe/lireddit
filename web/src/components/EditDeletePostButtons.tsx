import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Box, IconButton } from "@chakra-ui/react";
import NextLink from 'next/link';
import { useDeletePostMutation, useMeQuery } from '../generated/graphql';


interface EditDeletePostButtonProps {
  id: number,
  creatorId: number
}

export const EditDeletePostButtons: React.FC<EditDeletePostButtonProps> = ({
  id,
  creatorId
}) => {
  const [, deletePost] = useDeletePostMutation();
  const [{data: meData}] = useMeQuery();
  if  (meData?.me?.id !== creatorId ){
    return null
  }
  return (
    <Box> 
        <NextLink href = '/post/edit/[id]' as = {`/post/edit/${id}`}>
          <IconButton              
              mr = {4}
              colorScheme = 'facebook'
              aria-label="Edit Icon"
              size= "sm"
              icon={<EditIcon />}
          />   
      </NextLink>
      <IconButton
          onClick = {() => {
              deletePost({ id })
          }}
          colorScheme = 'facebook'
          aria-label="Delete Post"
          size= "sm"
          icon={<DeleteIcon />}
      />  
   </Box>
  );
}