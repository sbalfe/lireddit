import { Button } from '@chakra-ui/button';
import { Box } from '@chakra-ui/layout';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import router from 'next/dist/client/router';
import React from 'react';
import { InputField } from '../components/InputField';
import { Layout } from '../components/Layout';
import { useCreatePostMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';
import { useIsAuth } from '../utils/useIsAuth';

const CreatePost: React.FC<{}> = ({}) => {

  const [, createPost] = useCreatePostMutation();
  useIsAuth() // hooks defined in here for use here , readibility and reusability.
  return (
    <Layout variant = 'small'>
      <Formik 
                initialValues = {{title: '', text: ''}}
                onSubmit = {
                    async (values) => { 
                        const {error} = await createPost({input: values});
                        if(!error){
                          router.push("/")
                        }
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
                         create post
                        </Button>
                    </Form>
                )}  
            </Formik>
    </Layout>
  );
}

export default withUrqlClient(createUrqlClient)(CreatePost);