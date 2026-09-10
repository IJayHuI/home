import { supabase } from './supabase'
import type { LoginPayload } from '../types/auth'
import type { User, Session } from '@supabase/supabase-js'

/**
 * Supabase Auth 封装
 *
 * 使用 supabase.auth 的原生能力：
 * - signIn：邮箱密码登录
 * - signOut：登出
 * - getSession：获取当前 session（刷新页面时恢复登录态）
 * - onAuthStateChange：监听认证状态变化（token 过期/刷新自动同步）
 */

// 邮箱密码登录，返回 user
export async function signIn(payload: LoginPayload): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password
  })
  if (error) throw error
  return data.user!
}

// 登出
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// 获取当前 session（刷新页面时恢复登录态）
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

// 监听认证状态变化（token 过期/刷新自动同步）
export function onAuthStateChange(
  callback: (user: User | null) => void
) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}
