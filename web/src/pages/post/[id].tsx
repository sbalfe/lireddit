import { withUrqlClient } from 'next-urql';
import { Layout } from '../../components/Layout';
import { createUrqlClient } from '../../utils/createUrqlClient';
import { Heading, Box} from "@chakra-ui/react";
import { useGetPostFromUrl } from '../../utils/useGetPostFromUrl';
import { EditDeletePostButtons } from '../../components/EditDeletePostButtons';



export const Post = ({}) => {
  const [{data, error, fetching}] = useGetPostFromUrl();
  
  if (error){
    return <div>{error.message}</div>
  }

  if (fetching) {
    return (
      <Layout>
        <div>ITS FUCKING LOADING......</div>
      </Layout>
    )
  }

  if (!data?.post){
    return (
      <Layout>
        <Box>
          Could not find post
        </Box>
      </Layout>
    )
  }


  return(
    <Layout>
      <Heading mb = {4} >{data.post.title}</Heading>
      <Box mb = {4}>{data.post.text}</Box>
      <EditDeletePostButtons 
        id = {data.post.id} 
        creatorId = {data.post.creator.id}
      />
    </Layout>
  );
}

export default withUrqlClient(createUrqlClient, {ssr: true})(Post);