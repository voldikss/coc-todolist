import { xhr, XHROptions, XHRResponse, configure } from 'request-light'
import { resolve as urljoin } from 'url'
import { workspace } from 'coc.nvim'

export class Gist {
  public token = ''
  constructor() {
    //
  }

  public async get(path: string): Promise<XHRResponse> {
    return await this.request('GET', path)
  }

  public async post(path: string, data: Buffer): Promise<XHRResponse> {
    return await this.request('POST', path, data)
  }

  public async patch(path: string, data: Buffer): Promise<XHRResponse> {
    return await this.request('PATCH', path, data)
  }

  public async request(method: string, path: string, data?: Buffer): Promise<XHRResponse> {
    const headers = {
      'Accept-Encoding': 'gzip, deflate',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36'
    }
    const httpConfig = workspace.getConfiguration('http')
    configure(
      httpConfig.get<string>('proxy', undefined),
      httpConfig.get<boolean>('proxyStrictSSL', undefined)
    )
    if (this.token) headers['authorization'] = `token ${this.token}`

    const url = urljoin('https://api.github.com/', path)
    const xhrOptions: XHROptions = {
      type: method,
      url,
      data,
      headers,
      timeout: 3000,
      followRedirects: 5
    }
    try {
      return await xhr(xhrOptions)
    } catch (e) {
      return e
    }
  }
}
