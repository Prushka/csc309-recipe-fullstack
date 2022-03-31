import {Request, Response} from "express";
import {Role} from "../models/user";

import {ObjectId as ObjectIdType} from "mongoose";

const {ObjectId} = require('mongodb');

export function isValidationError(error: Error) {
    return error.name === "ValidationError"
}

export function serverError(res: Response) {
    res.status(500).send("Internal Server Error")
}

export function genericValidationInternal(res: Response, e: any) {
    if (e instanceof Error && isValidationError(e)) {
        res.status(400).send(e.message)
    } else {
        serverError(res)
    }
}

export function getObjectIdFromPara(req: Request, res: Response): ObjectIdType | null {
    const id = req.params.id
    if (!ObjectId.isValid(id)) {
        res.status(404).send("Invalid ID")
        return null
    }
    return ObjectId(id)
}

export function validateUser(req: Request, res: Response, role: Role = Role.USER) {
    if (!req.session.user) {
        res.status(401).send("Unauthorized")
        return false
    }
    const haveRole = req.session.user.role >= role
    if (!haveRole) {
        res.status(401).send("Unauthorized (Permission Denied)")
    }
    return haveRole
}