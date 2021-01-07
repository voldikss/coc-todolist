import { window, workspace } from "coc.nvim";
import fetch from 'node-fetch'
import express from 'express'
import { Server } from "http";
import GistConfig from "../util/gistcfg";
import { URLSearchParams } from "url";

export class GitHubOAuthService {
  private app: express.Express;
  private server: Server;
  private clientId = 'b32302cd17c89e5d8fcd'
  private clientSecret = 'f40b66f0851e9ce94b4ba643b64583fadbc103db'
  constructor(private gistcfg: GistConfig) {
    this.app = express();
    this.app.use(express.json(), express.urlencoded({ extended: false }));
  }

  public async start(): Promise<void> {
    this.app.get('/', (_req, res) => {
      res.redirect(
        `https://github.com/login/oauth/authorize?client_id=${this.clientId}&scope=gist`
      )
    })

    this.server = this.app.listen(3000)
    this.app.get('/oauth-callback', async (req, res) => {
      const params = new URLSearchParams(
        await (await this.getToken(req.query.code)).text()
      );
      res.send(`
            <html lang="en">
              <body>
                  <h1>Success! You may now close this tab.</h1>
                  <style>
                    html, body {
                      background-color: #1a1a1a;
                      color: #c3c3c3;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      height: 100%;
                      width: 100%;
                      margin: 0;
                    }
                  </style>
              </body>
            </html>
          `)
      this.server.close()
      const token = params.get('access_token')
      this.saveToken(token)
    })
    workspace.openResource('http://127.0.0.1:3000/')
  }

  private getToken(code: string) {
    const params = new URLSearchParams();
    params.append("client_id", this.clientId);
    params.append("client_secret", this.clientSecret);
    params.append("code", code);
    const promise = fetch(`https://github.com/login/oauth/access_token`, {
      method: "POST",
      body: params
    });
    return promise;
  }

  public async saveToken(token: string): Promise<void> {
    await this.gistcfg.push('userToken', token)
    window.showMessage('new token saved')
  }
}
