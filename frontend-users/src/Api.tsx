import { ApiRandomGetResponse, FetchError, } from "./Interfaces";

const API_USER_GET = `https://randomuser.me/api/?`;

export const API = {
    getUsers: async function (params: URLSearchParams) {
        return fetch(API_USER_GET + params)
            .then((response) => {
                if (response.ok) {
                    return response.json() as Promise<ApiRandomGetResponse>; // Convert response to promise with data type (Data)
                }
                throw new Error('Network response was not ok.');
            })
            .then((data: ApiRandomGetResponse) => {
                return { ...data, success: true };
            })
            .catch((error) => {
                return { message: 'there was a fetch error', data: error, success: false } as FetchError;
            });

    }
}

export default API;