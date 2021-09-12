import { FormControl, FormErrorMessage, FormLabel } from '@chakra-ui/form-control'
import { Input, Textarea } from '@chakra-ui/react';
import { useField } from 'formik';
import React from 'react'



/* make the input field the same as some regular input field taking in props */
type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    name: string;
    textarea?: boolean
}

/* 
    ignore size by passing in as _, this is to state its unused not required.
    it requires the format in a differenetw way the label and size 
*/

/*
    so to explain this, it first destructres various values of the passed in type inputfieldprops
    any values not named are passed to be under a props nesting as defined by ...props spread

    i.e. we use a placeholder which is first destructured off the input and then placed under props as

    props : {
        placeholder: "placeholderValue"
        ? any other optional props
    }
*/
export const InputField: React.FC<InputFieldProps> = ({label, size:_ , textarea, ...props}) => {

    let InputOrTextArea = Input
    if (textarea){
        InputOrTextArea = Textarea as any
    }
    //https://formik.org/docs/api/useField
    /* in short field holds val */

    const [field, {error}] = useField(props); /* props contains all the HTMl values associated with an input */

    return (
        /* cast a string to false with !!, checks for empty string to decide if an error is present. */

        /* https://chakra-ui.com/docs/form/form-control */
        <FormControl colorScheme = "pink" isInvalid = {!!error}>
           
            <FormLabel htmlFor={field.name}>{label}</FormLabel>
            {/*https://chakra-ui.com/docs/form/input*/}
            <InputOrTextArea 
                {...field}
                {...props}
                /* generic, can now handle any field type passed */
                id = {field.name}
                placeholder={props.placeholder} 
            />
            {error ? <FormErrorMessage>{error}</FormErrorMessage>: null}
        </FormControl>
    )
}