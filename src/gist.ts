import GitHubApi from "@octokit/rest"
import { workspace } from 'coc.nvim'

export class GitHubService {
  public userName: string = null
  public name: string = null
  private github: GitHubApi = null

  constructor(userToken: string) {
    const githubApiConfig: GitHubApi.Options = {}

    if (userToken !== null && userToken !== "") {
      githubApiConfig.auth = `token ${userToken}`
    }
    try {
      this.github = new GitHubApi(githubApiConfig)
    } catch (err) {
      workspace.showMessage(err)
      return
    }
    if (userToken !== null && userToken !== "") {
      this.github.users
        .getAuthenticated({})
        .then(res => {
          this.userName = res.data.login
          this.name = res.data.name
          workspace.showMessage(
            "Sync : Connected with user : " + "'" + this.userName + "'"
          )
        })
        .catch(err => {
          workspace.showMessage(err)
          return
        })
    }
  }

  // shouldn't typeof gistObj be GistsCreateParams(will raise error)?
  public async createGist(gistObj: any): Promise<string> {
    try {
      const res = await this.github.gists.create(gistObj)
      if (res.data && res.data.id) {
        return res.data.id.toString()
      } else {
        workspace.showMessage("ID is null")
        workspace.showMessage("Sync : " + "Response from GitHub is: ")
        workspace.showMessage(JSON.stringify(res))
        return
      }
    } catch (err) {
      workspace.showMessage(err)
      return
    }
  }

  public async readGist(
    gistId: string
  ): Promise<GitHubApi.Response<any>> {
    const promise = this.github.gists.get({ gist_id: gistId })
    const res = await promise.catch(err => {
      if (String(err).includes("HttpError: Not Found")) {
        workspace.showMessage('Sync: Invalid Gist ID', 'error')
        return
      }
    })
    if (res) {
      return res
    }
  }

  // gistObject should be GistsUpdateParams...
  // but this will fails when pass a GistsUpdateParams
  public async updateGist(gistObject: any): Promise<boolean> {
    const promise = this.github.gists.update(gistObject)

    const res = await promise.catch(err => {
      if (String(err).includes("HttpError: Not Found"))
        workspace.showMessage("Sync: Invalid Gist ID", 'error')
      else
        workspace.showMessage(err)
      return
    })

    if (res) {
      return true
    }
  }
}
