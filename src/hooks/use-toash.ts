import { toast } from "react-hot-toast";

const useToast = () =>{
    return{
        success: (message: string) => toast.success(message, { duration: 3000 }),
        error: (message: string) => toast.error(message, { duration: 3000 }),
        info: (message: string) => toast(message, { duration: 3000 }),
    }
}
export default useToast