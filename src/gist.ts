import { workspace } from 'coc.nvim'
import GitHubApi from '@octokit/rest'

export default class Gist {
  private github: GitHubApi = null
  public userName: string = null
  private isLogin = false

  constructor(private token: string) { }

  private async checkLogin(): Promise<boolean> {
    if (this.isLogin) return true

    const githubApiConfig: GitHubApi.Options = {}

    if (this.token !== null && this.token !== '') {
      githubApiConfig.auth = `token ${this.token}`
    }

    try {
      this.github = new GitHubApi(githubApiConfig)
    } catch (err) {
      workspace.showMessage(err, 'error')
      return false
    }
    if (this.token !== null && this.token !== '') {
      this.github.users
        .getAuthenticated({})
        .then(res => {
          this.userName = res.data.login
          workspace.showMessage(`Gist: Connected with user: ${this.userName}`)
          this.isLogin = true
          return true
        })
        .catch(err => {
          workspace.showMessage(`Login Error: ${err}`, 'error')
          return false
        })
    }
  }

  // shouldn't typeof gistObj be GistsCreateParams(will raise error)?
  public async create(gistObj: any): Promise<string> {
    if (!this.checkLogin()) return

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
    if (!this.checkLogin()) return

    const promise = this.github.gists.get({ gist_id: gistId })
    const res = await promise.catch(err => {
      if (String(err).includes('HttpError: Not Found'))
        workspace.showMessage('Error: Invalid Gist ID', 'error')
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
    if (!this.checkLogin()) return

    const promise = this.github.gists.update(gistObject)

    const res = await promise.catch(err => {
      if (String(err).includes('HttpError: Not Found'))
        workspace.showMessage('Sync: Invalid Gist ID', 'error')
      else
        workspace.showMessage(err)
      return
    })

    if (res) {
      return true
    }
  }
}
