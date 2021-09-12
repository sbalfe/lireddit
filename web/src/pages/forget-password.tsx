
import { Form, Formik } from 'formik';
import React, { useState } from 'react'
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';
import { Button } from '@chakra-ui/button';
import { Box } from '@chakra-ui/layout';
import { useForgotPasswordMutation } from '../generated/graphql';

const ForgotPassword: React.FC<{}> = ({}) => {

  const [, forgotPassword] = useForgotPasswordMutation();
  const [complete, setComplete] = useState(false);

  return (
     <Wrapper variant = "small">
            <Formik 
                initialValues = {{email: ""}}
                onSubmit = {
                    /* set errors possibly here, change the resolver to say if they entered nothing */
                    async (values) => { 
                         const response = await forgotPassword(values);
                         setComplete(true);
                    }}>

               
                {({isSubmitting}) => complete ? <Box>If that email exists with an account, an email has been sent</Box>: (
                   <Form>
                       <InputField 
                            name = "email" 
                            placeholder = "email" 
                            label = "Email" 
                            type = "email"
                       />
                       <Button 
                            _hover = {{
                                backgroundColor: "purple", 
                                color: "white",
                            }}
                            ml = "auto"
                            mr = "auto"
                            mt = {4}
                            display = "block"
                            type = "submit"
                            color = "white"
                            backgroundColor = "teal"
                            isLoading = {isSubmitting}
                        > 
                         forgot password
                        </Button>
                    </Form>
                )}  
            </Formik>
        </Wrapper>
  );
}

export default withUrqlClient(createUrqlClient, {ssr: true})(ForgotPassword)