import { IRateLimitState } from './rate-limit'

export type AsyncFunc = () => Promise<any>
export type RateLimitUpdateFunc = (_: any) => IRateLimitState

