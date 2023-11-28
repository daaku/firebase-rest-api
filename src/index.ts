// FirebaseConfig holds the base configuration and provides helpers to build
// paths & URLs in the context of that configuration.
export class FirebaseConfig {
  public readonly apiKey: string
  public readonly projectID: string
  public readonly databaseID: string
  public readonly host: string
  public readonly protocol: 'https' | 'http'
  public readonly databasePath: string
  public readonly endpointURL: string

  constructor({
    apiKey,
    projectID,
    databaseID = '(default)',
    host = 'firestore.googleapis.com',
    protocol = 'https',
  }: {
    apiKey: string
    projectID: string
    databaseID?: string
    host?: string
    protocol?: 'https' | 'http'
  }) {
    this.apiKey = apiKey
    this.projectID = projectID
    this.databaseID = databaseID
    this.host = host
    this.protocol = protocol
    this.databasePath = `projects/${projectID}/databases/${databaseID}/documents`
    this.endpointURL = `${protocol}://${host}/v1/${this.databasePath}`
  }

  // Returns the document path in the form of
  // projects/{project_id}/databases/{database_id}/documents/{document_path}.
  public docPath(docPath: string): string {
    return `${this.databasePath}/${docPath}`
  }
}

// FirebaseAPI is the high level API wrapper. It will throw errors and return
// JSON decoded values on success.
export interface FirebaseAPI {
  (method: string, path: string, body?: unknown): Promise<unknown>
}

// TokenSource is invoked for each API call to find if a token is available for
// Authorization. It should handle caching and refreshing it internally.
export interface FirebaseTokenSource {
  (): Promise<string | undefined>
}

// Make an API instance pre-configured with the endpoint. It will fetch a token
// from the TokenSource on each API call.
export function makeFirebaseAPI({
  config,
  tokenSource,
  next = fetch,
}: {
  config: FirebaseConfig
  tokenSource: FirebaseTokenSource
  next?: typeof fetch
}): FirebaseAPI {
  return async (method, path, body) => {
    const init: RequestInit = { method }
    if (typeof body !== 'undefined') {
      init.body = JSON.stringify(body)
    }
    const request = new Request(config.endpointURL + path, init)
    const token = await tokenSource()
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    const response = await next(request)
    if (response.ok) {
      return await response.json()
    }
    const data = await response.json()
    if (Array.isArray(data)) {
      throw data.length === 1 ? Object.assign(new Error(), data[0].error) : data
    }
    throw Object.assign(new Error(), data.error)
  }
}
