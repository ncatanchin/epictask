
export type AuthScope = "repo" | "user" | "org"

export const AuthScopeRequired = Array<AuthScope>("repo","user","org")

export interface IConfig {
	accessToken: string | null
	scope: Array<AuthScope>
}
