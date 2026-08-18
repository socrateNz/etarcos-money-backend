import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

export const successResponse = <T>(data: T, message?: string, status = 200) => {
  const body: ApiResponse<T> = { success: true, message, data };
  return NextResponse.json(body, { status });
};

export const errorResponse = (message: string, error?: any, status = 400) => {
  const body: ApiResponse<null> = { success: false, message, error };
  return NextResponse.json(body, { status });
};
