/* this is in a sub folder with [token] to act as variable name so next.js knows where it is
  in some url localhost:3000/change-password/[token]
*/

import { Link, Box, Button, Flex  } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { NextPage } from 'next';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/dist/client/router';
import React, { useState } from 'react';
import { InputField } from '../../components/InputField';
import { Wrapper } from '../../components/Wrapper';
import { useChangePasswordMutation } from '../../generated/graphql';
import { createUrqlClient } from '../../utils/createUrqlClient';
import { toErrorMap } from '../../utils/toErrorMap';
import  NextLink from 'next/link'

/* next page with the token as the parameter */
export const ChangePassword: NextPage = () => {

  const router = useRouter();
  const [, ChangePassword ] = useChangePasswordMutation();
  const [tokenError, setTokenError] = useState('');

  return (
     <Wrapper variant = "small">
            <Formik 
                initialValues = {{newPassword: ''}}
                onSubmit = {
                    async (values, {setErrors}) => { 
                      
                          const response = await ChangePassword({
                           newPassword: values.newPassword, 
                           token: typeof router.query.token === "string" ? router.query.token : "", /* check if token is on query param otherwise set to empty string */
                          })

                          console.log(response);
                         
                          if (response.data?.changePassword.errors){
                           
                            const errorMap = toErrorMap(response.data.changePassword.errors)
                         
                            /* check to see if token is present, then set token error value to be displayed.*/
                            if ('token' in errorMap){
                               setTokenError(errorMap.token);
                            }
                           
                        
                            setErrors(errorMap);
                           
                          } else if (response.data?.changePassword.user){
                            // Worked
                         
                            router.push('/');
                          }
                        
                    }}>
                {({isSubmitting}) => (
                   <Form>
                       <InputField 
                            name = "newPassword" 
                            placeholder = "new password" 
                            label = "New Password" 
                            type = "password"
                       />
                       { tokenError ? 
                       <Flex>
                        <Box>
                            <Box mr ={2} style = {{color: 'red'}}> {tokenError} </Box>
                            <NextLink href = '/forget-password'>
                              <Link>Get a new password</Link>
                            </NextLink>
                          </Box>
                        </Flex>
                        :null
                        }
                       <Button 
                           
                            ml = "auto"
                            mr = "auto"
                            mt = {4}
                            display = "block"
                            type = "submit"
                            backgroundColor ="teal"
                            color = "white"
                            isLoading = {isSubmitting}
                        > 
                         change password
                        </Button>
                    </Form>
                )}  
            </Formik>
        </Wrapper>
  );
}
export default withUrqlClient(createUrqlClient)(ChangePassword as any);