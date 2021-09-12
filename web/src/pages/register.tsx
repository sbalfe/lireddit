import React from 'react';
import {Formik, Form} from 'formik';
import { Box, Button} from '@chakra-ui/react';
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { useRegisterMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import { useRouter } from 'next/dist/client/router';
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from '../utils/createUrqlClient';


/*
    enforce types for functional components, 
*/
interface registerProps {}
  
/*
    react.FC checks if the signature of the function is correct and return value is valid JSX
*/


const Register: React.FC<registerProps> = ({}) => {
     const router = useRouter();
     const [, register] = useRegisterMutation();
     return (
        <Wrapper variant = "small">
            <Formik 
                initialValues = {{email: "", username: "", password: ""}}
                onSubmit = {
                    
                    async (values, {setErrors}) => { 
                        /* this is  a promise retruned therefore just return */

                         /* maps to the graphql mutation specified above */
                    
                         const response = await register({options: values});
                         console.log(response);
                   
                         /* code gen is detecting the types of this response from graphql */

                         /* check if the errors object has any errors */
                         if (response.data?.register.errors){
                           
                            /* map then into a key:value pair for use in the formik set errors to nicely display the errors */
                            setErrors(toErrorMap(response.data.register.errors));
                         } else if(response.data?.register.user){
                             /* use next js hook to return to homepage  */
                             router.push('/');
                         }
                         
                    }}>

                {/* 
                    this is a render prop, we are taking values state and handleChange function from Formik , and passing our logic in
                    using the handles they gave us.
                */}
                {({isSubmitting}) => (
                   <Form>
                        <Box mt = {4}>
                            <InputField 
                                name = "username" 
                                placeholder = "username" 
                                label = "Username" 
                            />
                        </Box>
                        <Box mt = {4}>
                            <InputField 
                                name = "email" 
                                placeholder = "email" 
                                label = "Email" 
                            />
                       </Box>
                       <Box mt = {4}>
                            <InputField 
                                name = "password" 
                                placeholder = "password" 
                                label = "Password" 
                                type = "password"
                            />
                       </Box>
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
                            backgroundColor = "black"
                            /* this loads whenever we are submittting, a cool loading symbol */
                            isLoading = {isSubmitting}
                        > 
                         register
                        </Button>
                    </Form>
                )}  
            </Formik>
        </Wrapper>
    )
}

export default withUrqlClient(createUrqlClient, {ssr: true})(Register);