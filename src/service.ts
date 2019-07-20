import { workspace } from 'coc.nvim'
import GitHubApi from '@octokit/rest'
import Config from './util/config'

export default class GitHubService {
  private github: GitHubApi = null
  private isLogin = false

  constructor(private extCfg: Config) {
  }

  private async getToken(): Promise<string> {
    let token = await this.extCfg.fetch('userToken')
    if (!token) {
      token = await workspace.requestInput('Input github token')
      if (!token || token.trim() === '')
        return
      token = token.trim()
      await this.extCfg.push('userToken', token)
    }
    return token
  }

  private async login(token: string): Promise<boolean> {
    if (this.isLogin) return true

    const githubApiConfig: GitHubApi.Options = {}

    if (token !== null && token !== '') {
      githubApiConfig.auth = `token ${token}`
    }

    try {
      this.github = new GitHubApi(githubApiConfig)
    } catch (err) {
      workspace.showMessage(err, 'error')
      return false
    }
    if (token !== null && token !== '') {
      return new Promise(resolve => {
        this.github.users.getAuthenticated({})
          .then(_res => {
            const username = _res.data.login
            workspace.showMessage(`Gist: Connected with: ${username}`)
            resolve(true)
          })
          .catch(async _err => {
            workspace.showMessage(`Login Error: ${_err}`, 'error')
            await this.extCfg.delete('userToken')
            resolve(false)
          })
      })
    }
  }

  public async init(): Promise<boolean> {
    const token = await this.getToken()
    if (!token)
      return false

    const status = await this.login(token)
    return status
  }

  // shouldn't typeof gistObj be GistsCreateParams(will raise error)?
  public async create(gistObj: any): Promise<string> {
    try {
      const res = await this.github.gists.create(gistObj)
      if (res.data && res.data.id) {
        return res.data.id.toString()
      } else {
        workspace.showMessage('ID is null')
        workspace.showMessage('Error : Response from GitHub is: ')
        workspace.showMessage(JSON.stringify(res, null, 2))
        return
      }
    } catch (err) {
      workspace.showMessage(err, 'error')
      return
    }
  }

  public async read(gistId: string): Promise<GitHubApi.Response<any>> {
    const promise = this.github.gists.get({ gist_id: gistId })
    const res = await promise.catch(async err => {
      if (String(err).includes('HttpError: Not Found')) {
        workspace.showMessage('Error: Invalid Gist ID', 'error')
        await this.extCfg.delete('gistId')
      }
      else
        workspace.showMessage(`Error: ${err}`)
      return
    })

    if (res) {
      return res
    }
  }

  // gistObject should be GistsUpdateParams...
  // but this will fails when pass a GistsUpdateParams
  public async update(gistObject: any): Promise<boolean> {
    const promise = this.github.gists.update(gistObject)

    const res = await promise.catch(async err => {
      if (String(err).includes('HttpError: Not Found')) {
        workspace.showMessage('Sync: Invalid Gist ID', 'error')
        await this.extCfg.delete('gistId')
      }
      else
        workspace.showMessage(err)
      return
    })

    if (res) {
      return true
    }
  }
}
