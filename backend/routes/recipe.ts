/*
 * Copyright 2022 Dan Lyu
 */

import {getUserFromSession, requireObjectIdFromPara} from "../utils/util";
import {IUser, Role, SessionUser, User} from "../models/user";
import {IRecipe, Recipe} from "../models/recipe";
import express from "express";
import {publicRoute, userRoute} from "./route";
import {EndpointError, throwError} from "../errors/errors";
import {ObjectId as ObjectIdType} from "mongoose";
import {getOutputUser, userRouter} from "./user";

const {ObjectId} = require('mongodb');

export async function requireRecipeFromId(id: ObjectIdType): Promise<IRecipe> {
    const recipe = await Recipe.findById(id)
    if (!recipe) {
        throwError(EndpointError.RecipeNotFound)
    }
    return recipe!
}

function requireRecipeEdit(user: SessionUser, recipe: IRecipe) {
    if (recipe.author !== user._id && user.role < Role.ADMIN) {
        throwError(EndpointError.NoPermission)
    }
}

export const recipeRouter = express.Router();
recipeRouter.delete('/:id', userRoute(async (req, res, sessionUser) => {
    const id = requireObjectIdFromPara(req)
    let recipe = await requireRecipeFromId(id)
    requireRecipeEdit(sessionUser, recipe)
    await recipe.delete()
    res.send("deleted")
}))

recipeRouter.patch('/:id', userRoute(async (req, res, sessionUser) => {
    const id = requireObjectIdFromPara(req)
    let recipe = await requireRecipeFromId(id)
    requireRecipeEdit(sessionUser, recipe)
    recipe.title = req.body.title ?? recipe.title
    recipe.instructions = req.body.instructions ?? recipe.instructions
    recipe.ingredients = req.body.ingredients ?? recipe.ingredients
    recipe.category = req.body.category ?? recipe.category
    recipe.tags = req.body.tags ?? recipe.tags
    if (sessionUser!.role > Role.USER) {
        recipe.approved = req.body.approved ?? recipe.approved
    }
    recipe = await recipe.save()
    res.send(recipe)

}))

recipeRouter.post('/save/:id', userRoute(async (req, res, sessionUser) => {
    const id = requireObjectIdFromPara(req)
    let recipe = await requireRecipeFromId(id)
    const user = await User.findByIdAndUpdate(
        sessionUser._id,
        {$addToSet: {savedRecipes: recipe._id}},
        {new: true})
    res.send(getOutputUser(user!))
}))

recipeRouter.delete('/save/:id', userRoute(async (req, res, sessionUser) => {
    const id = requireObjectIdFromPara(req)
    let recipe = await requireRecipeFromId(id)
    const user = await User.findByIdAndUpdate(
        sessionUser._id,
        {$pull: {savedRecipes: recipe._id}},
        {new: true})
    res.send(getOutputUser(user!))
}))

recipeRouter.post('/', userRoute(async (req, res, sessionUser) => {
    let recipe = new Recipe({
        title: req.body.title,
        category: req.body.category,
        // content: req.body.content,
        instructions: req.body.instructions,
        ingredients: req.body.ingredients,
        author: sessionUser._id,
        tags: req.body.tags
    })
    recipe = await recipe.save()
    res.send(recipe)
}))

recipeRouter.get('/me', userRoute(async (req, res) => {
    res.send(await Recipe.findRecipeByUser(req.session.user!._id!))
}))

recipeRouter.get('/:id', publicRoute(async (req, res) => {
        const id = requireObjectIdFromPara(req)
        res.send(await Recipe.findRecipeByUser(id))
    })
)

recipeRouter.get('/', publicRoute(async (req, res) => {
    res.send(await Recipe.find())
}))