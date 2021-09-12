import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMeQuery } from "../generated/graphql";

export const useIsAuth = () => {

    const [{data, fetching}] = useMeQuery();
    const router = useRouter();

    console.log(router);
    useEffect(() => {
      console.log("test")
      if (!fetching && !data?.me){ /* when not loading and not valid me query logged in */
        /* this redirects to where the original value was after thay have logged in */
        router.replace('/login?next=' + router.pathname) /* automatically send to login if they arent logged in */
      }
    }, [fetching, data, router])

}