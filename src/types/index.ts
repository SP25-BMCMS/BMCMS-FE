export type LoginUserAPIResponse = {
    accessToken: string,
    refreshToken: string,
    userId: string,
    username:string
}
export type GetCurrentUserAPIResponse ={
    userId: string,
    username: string,
    email: string,
}
export type Residents ={
    id: string,
    name: string,
    createdDate: string,
    status: 'active' | 'inactive';
}
