import { usePostQuery } from "../generated/graphql";
import { useGetIntId } from "./useGetIntId";

export const useGetPostFromUrl = () => {

  const intId = useGetIntId();
  return usePostQuery({
    pause: intId === -1, // dont request the server if negative one as its never going to return.
    variables: {
      id: intId,
    }
  });
}