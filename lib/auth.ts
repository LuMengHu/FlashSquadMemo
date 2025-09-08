// lib/auth.ts

import 'server-only';
import { jwtVerify, JWTPayload } from 'jose';
import { NextRequest } from 'next/server';

// 这是我们期望从JWT载荷中得到的结构
export interface TeamPayload extends JWTPayload {
  teamId: string;
  teamName: string;
}

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in the environment variables.');
  }
  return new TextEncoder().encode(secret);
}

/**
 * 验证来自请求的认证信息 (JWT)
 * @param req - Next.js Route Handler 的 Request 或 NextRequest 对象
 * @returns 返回一个包含验证结果的对象
 */
export async function verifyAuth(req: Request | NextRequest) {
  const token = req.headers.get('Authorization')?.split(' ')[1];

  if (!token) {
    return { team: null, error: 'Missing authorization token.' };
  }

  try {
    // 验证 token，并直接将 payload 的类型指定为我们期望的 TeamPayload
    const { payload } = await jwtVerify<TeamPayload>(token, getJwtSecretKey());

    // 进行简单的属性检查，确保关键字段存在
    if (typeof payload.teamId !== 'string' || typeof payload.teamName !== 'string') {
        throw new Error('Invalid token payload: missing teamId or teamName.');
    }
    
    // 验证成功，返回解析出的 team 信息
    return { team: payload, error: null };
  } catch (error) {
    // 明确地处理错误类型
    const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
    console.error('JWT Verification Failed:', errorMessage);
    // 返回更具体的错误信息
    return { team: null, error: `Invalid token: ${errorMessage}` };
  }
}
