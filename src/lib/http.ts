type CustomOptions = Omit<RequestInit, 'method'> & {
  baseUrl?: string | undefined
  skipAuth?: boolean // Option to skip automatic token inclusion
  // biome-ignore lint/suspicious/noExplicitAny: Simplified to avoid complex type intersections
  body?: any
}

// Utility function to check if we're running on the client side
const isClient = (): boolean => {
  return typeof window !== 'undefined'
}

const request = async <Response>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  options: CustomOptions | undefined,
) => {
  let body: FormData | string | undefined = undefined
  if (options?.body instanceof FormData) {
    body = options.body
  } else if (options?.body) {
    body = JSON.stringify(options.body)
  }
  const baseHeaders: { [key: string]: string } =
    body instanceof FormData ? {} : { 'Content-Type': 'application/json' }

  // Automatic token interceptor - include token in headers if available and not skipped
  if (isClient() && !options?.skipAuth) {
    const sessionToken = localStorage.getItem('sessionToken')
    if (sessionToken) {
      baseHeaders.Authorization = `Bearer ${sessionToken}`
    }
  }
  const baseUrl =
    options?.baseUrl === undefined
      ? process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://api.coursity.io.vn/api/v1'
      : options.baseUrl

  const fullUrl = `${baseUrl}${url}`
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      ...baseHeaders,
      ...options?.headers,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } as any,
    body,
    method,
  })
  const payload: Response = await res.json()
  const data = {
    status: res.status,
    payload,
  }
  if (!res.ok) {
    throw new HttpError(data)
  }
  // Đảm bảo logic dưới đây chỉ chạy ở phía client (browser)
  // if (isClient()) {
  //   if (
  //     ['auth/login', 'auth/register'].some(
  //       (item) => item === normalizePath(url)
  //     )
  //   ) {
  //     const { token, expiresAt } = (payload as LoginResType).data
  //     localStorage.setItem('sessionToken', token)
  //     localStorage.setItem('sessionTokenExpiresAt', expiresAt)
  //   } else if ('auth/logout' === normalizePath(url)) {
  //     localStorage.removeItem('sessionToken')
  //     localStorage.removeItem('sessionTokenExpiresAt')
  //   }
  // }
  return data
}
export class HttpError extends Error {
  status: number
  payload: {
    message: string
    [key: string]: any
  }
  constructor({ status, payload }: { status: number; payload: any }) {
    super('Http Error')
    this.status = status
    this.payload = payload
  }
}
class Http {
  get<Response>(url: string, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('GET', url, options)
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  post<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('POST', url, { ...options, body })
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  patch<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('PATCH', url, { ...options, body })
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  put<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('PUT', url, { ...options, body })
  }

  delete<Response>(url: string, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('DELETE', url, { ...options })
  }
}

const http = new Http()

export default http
