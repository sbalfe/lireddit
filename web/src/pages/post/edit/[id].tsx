import { Button } from '@chakra-ui/button';
import { Box } from '@chakra-ui/layout';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/dist/client/router';
import { InputField } from '../../../components/InputField';
import { Layout } from '../../../components/Layout';
import { usePostQuery, useUpdatePostMutation } from '../../../generated/graphql';
import { createUrqlClient } from '../../../utils/createUrqlClient';
import { useGetIntId } from '../../../utils/useGetIntId';

interface  test {}

const EditPost = ({}) => {

  const router = useRouter();
  const intId = useGetIntId();
  const [{data , fetching}] = usePostQuery({
    pause: intId === -1, // dont request the server if negative one as its never going to return.
    variables: {
      id: intId,
    }
  });
  const [,updatePost] = useUpdatePostMutation();

  if (fetching) {
    return (
      <Layout>
        <div>loading...</div>  
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

  return (
     <Layout variant = 'small'>
      <Formik 
                initialValues = {{title: data.post.title, text: data.post.text}}
                onSubmit = {
                    async (values) => {  
                        await updatePost({id: intId, ...values});
                        router.back(); // return to previous page.
                    }}>
                {({isSubmitting}) => (
                   <Form>
                       <InputField 
                            name = "title" 
                            placeholder = "title" 
                            label = "Title" 
                       />
                       <Box>
                            <InputField 
                                name = "text" 
                                placeholder = "text..." 
                                label = "Body" 
                                textarea
                            />
                       </Box>
                       <Button 
                            ml = "auto"
                            mr = "auto"
                            mt = {4}
                            display = "block"
                            type = "submit"
                            backgroundColor = "teal"
                        
                            isLoading = {isSubmitting}
                        > 
                         update post
                        </Button>
                    </Form>
                )}  
            </Formik>
    </Layout>
  );
}

export default withUrqlClient(createUrqlClient, {ssr: true})(EditPost);