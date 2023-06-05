
interface User {
    key: string,
    fullname: string,
    gender: string,
    email: string
}

interface ApiUserStructure {
    name: {
        first: string,
        last: string,
        title: string
    },
    gender: string,
    email: string
}

interface ApiRandomGetResponse {
    info: {
        page: number,
        results: number,
        seed: string,
        version: string
    },
    results: [],
    success: boolean
}

interface FetchError {
    message: string,
    data: any,
    success: boolean
}


interface ExportCsvProp {
    filename?: string;
    userList: User[],
    textButton: string
}

enum UserIndexName {
    FullName = "fullname",
    Email = "email",
    Gender = "gender"
}

interface TxtVal {
    text: string,
    value: string
}

export type { ApiRandomGetResponse, User, FetchError, ExportCsvProp, TxtVal, ApiUserStructure }
export { UserIndexName }