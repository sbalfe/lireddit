import React from 'react';
import {Formik, Form} from 'formik';
import { Box, Button, Flex, Link} from '@chakra-ui/react';
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { useLoginMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import { useRouter } from 'next/dist/client/router';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';
import NextLink from 'next/link'

/*
    enforce types for functional components, 
*/
interface registerProps {}
  
/*
    react.FC checks if the signature of the function is correct and return value is valid JSX
*/
const Login: React.FC<{}> = ({}) => {
     const router = useRouter();
     /*
        same as useMutation but has types for specific login
        therefore we can have type checking and intellisense for this specific query.
     */
     const [,login] = useLoginMutation();
     return (
        <Wrapper variant = "small">
            <Formik 
                initialValues = {{usernameOrEmail: "", password: ""}}
                onSubmit = {
                    /* setErrors destructured of actions */
                    async (values, {setErrors}) => { 
                   
                        /* this is  a promise retruned therefore just return */

                         /* maps to the graphql mutation specified above */

                         const response = await login(values);
        
                         /* code gen is detecting the types of this response from graphql */

                         /* check if the errors object has any errors */
                         if (response.data?.login.errors){
                          
                            /* map then into a key:value pair for use in the formik set errors to nicely display the errors */
                            setErrors(toErrorMap(response.data.login.errors));
                         } else if(response.data?.login.user){
                
                             console.log(router);
                             if (typeof router.query.next === 'string'){
                                // worked
                                /* use next js hook to return to homepage or the last page we were on defined in next query param  */
                                router.push(router.query.next);
                             }
                             else {
                                 router.push('/')
                             }
                         }          
                    }}> 
                {/* 
                    this is a render prop, we are taking values state and handleChange function from Formik , and passing our logic in
                    using the handles they gave us.
                */}
                {({isSubmitting}) => (
                   <Form>
                       <InputField 
                            name = "usernameOrEmail" 
                            placeholder = "username or email" 
                            label = "Username or Email" 
                       />
                       <Box>
                            <InputField 
                                name = "password" 
                                placeholder = "password" 
                                label = "Password" 
                                type = "password"
                            />
                       </Box>
                       <Flex mt = {2}> 
                            <NextLink href = '/forget-password'>
                                <Link ml = 'auto' >forgot password?</Link>
                            </NextLink>
                        </Flex>
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
                         login
                        </Button>
                    </Form>
                )}  
            </Formik>
        </Wrapper>
    )
}

export default withUrqlClient(createUrqlClient, {ssr: true})(Login);