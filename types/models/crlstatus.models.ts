import { ObjectId } from 'mongoose'

export interface CRLStatus {
    _id: ObjectId,
    chunk: Number,
    totalChunk: Number,
    version: Number,
    targetVersion: Number,
    completed?: boolean,
    created_at: Date,
    updated_at: Date,
    _v: Number
}