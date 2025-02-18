import apiInstance from '@/lib/axios'
import { GetCurrentUserAPIResponse,LoginUserAPIResponse } from '@/types'

const signIn = async (username: string, password: string): Promise<LoginUserAPIResponse> => {
  try {
    const { data } = await apiInstance.post<LoginUserAPIResponse>(
      import.meta.env.VITE_LOGIN_API,
      { username, password }
    );
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Invalid username or password");
  }
};


// const logOut = async () => {
//   try {
//     const resp = await apiInstance.post(import.meta.env.VITE_LOGOUT_API)
//     return resp.data
//   } catch (error) {
//     return { error: true }
//   }
// }

// const refreshToken = async (refreshToken: string) => {
//   try {
//     const resp = await apiInstance.post(import.meta.env.VITE_REFRESH_API, {
//       refreshToken: refreshToken
//     })
//     return resp.data
//   } catch (e) {
//     return e
//   }
// }

const getCurrentUser = async () => {
  try {
    const { data } = await apiInstance.get<GetCurrentUserAPIResponse>(import.meta.env.VITE_CURRENT_USER_API)
    return data
  } catch (error) {
    return null
  }
}

const authApi = {
  signIn,
//   logOut,
//   refreshToken,
  getCurrentUser
}

export default authApi
