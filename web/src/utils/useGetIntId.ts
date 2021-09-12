import { useRouter } from "next/router";

export const useGetIntId = () => {

  const router = useRouter();
  const IntId = typeof router.query.id === 'string' ? parseInt(router.query.id): -1
  return IntId;

}