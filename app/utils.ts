/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
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
    let message = data.message || data.error?.message
    let status = data.code || 500
    //@ts-ignore
    if(data.error?.messages){
      //@ts-ignore
      if(data.error?.messages.length){
        status = 422
        //@ts-ignore
        message = data.error?.messages[0].message
      }
    }
    return response.status(status).json({
      message: message
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
  
  export function gisQuery(param: {
    startLatitude: number
    startLongitude: number
    stopLatitude: number
    stopLongitude: number
  }) {
    return `latitude BETWEEN ${param.startLatitude} AND ${param.stopLatitude}
          AND longitude BETWEEN ${param.startLongitude} AND ${param.stopLongitude}`
    // return `CAST(to_json(gps_cordinates::json)->>'latitude' as double precision) BETWEEN ${param.startLatitude} AND ${param.stopLatitude}
    //       AND CAST(to_json(gps_cordinates::json)->>'longitude' as double precision) BETWEEN ${param.startLongitude} AND ${param.stopLongitude}`
  }


  export function calculateBoundingBox (latitude:number, longitude:number, distance:number) {
    // Earth's radius in kilometers
    const earthRadius = 6371
  
    // Convert distance from kilometers to degrees
    const distanceInDegrees = distance / earthRadius
  
    // Calculate minimum and maximum latitudes
    const minLat = latitude - distanceInDegrees
    const maxLat = latitude + distanceInDegrees
  
    // Calculate minimum and maximum longitudes
    const minLng = longitude - distanceInDegrees / Math.cos((latitude * Math.PI) / 180)
    const maxLng = longitude + distanceInDegrees / Math.cos((latitude * Math.PI) / 180)
  
    // Return the bounding box
    return {
      minLat: minLat,
      maxLat: maxLat,
      minLng: minLng,
      maxLng: maxLng,
    }
  }

  export async function ValidateHandler(handler:()=>void,response:Response){
    try {
      handler()
    } catch {
      console.log("HERE IS THE ERROR")
      return sendError(response,{message:''})
    }
  }


  export function lowerCase(text:string){
    return text.toLowerCase()
  }

  export function generateOTP(length = 6) {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10); // Random digit between 0 and 9
    }
    return otp;
}

export function getMonthStartAndEnd(dateString:string) {
  // Parse the input date
  const date = new Date(dateString);

  // Calculate the start of the month
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);

  // Calculate the end of the month
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0]
  };
}