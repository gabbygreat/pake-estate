import { randomBytes } from 'crypto'
// import app from "@adonisjs/core/services/app";
// import { unlink } from "fs/promises";
//For Random string generation
import { Response } from '@adonisjs/core/http';
export function randomString(length = 32) {
    return randomBytes(length).toString('hex');
}

export const timestamp = () => Math.floor(Date.now() / 1000);

export function sendError(
    response: Response,
    data: Partial<{
      code: number;
      message: string;
      error: Error;
    }>
  ) {
    return response.status(data.code || 500).json({
      message: data.message || data.error?.message,
    });
  }
  
  export function sendSuccess(
    response: Response,
    data: Partial<{
      message?: string;
      data?: any;
      code?: any;
    }>
  ) {
    return response.status(200).json({
      error: false,
      data: data.data,
      code: data.code,
      message: data.message,
    });
  }
  