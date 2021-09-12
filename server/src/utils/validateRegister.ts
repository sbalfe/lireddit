import { UsernamePasswordInput } from "./usernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput ) => {

       if (!options.email.includes('@')){
            return [
              {
                    field: 'email',
                    message: 'invalid email'
              }
          ];
        }

        if (options.username.length <= 2){
            return [{
                    field: 'username',
                    message: 'username too short, must be > 2'
                }
              ];
        }

        if (options.password.length <= 3){
            return [
                  {
                    field: 'password',
                    message: 'password too short, must be > 3'
                  }
              ];
        }

    
        return null;
}