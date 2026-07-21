import { NextFunction, Request, Response } from "express";

import {
  createNamedEntity,
  getNamedEntities,
} from "../../modules/catalog/catalog.service";

type EntityType = "languages" | "genres" | "actors";

function entityTypeFromPath(path: string): EntityType {
  return path.includes("languages")
    ? "languages"
    : path.includes("genres")
      ? "genres"
      : "actors";
}

export async function listCatalogController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const entityType = entityTypeFromPath(request.path);
    response.status(200).json({ [entityType]: await getNamedEntities(entityType) });
  } catch (error) {
    next(error);
  }
}

export async function createCatalogController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const entityType = entityTypeFromPath(request.path);
    const entity = await createNamedEntity(entityType, request.body);
    response.status(201).json({
      message: `${entityType.slice(0, -1)} created successfully`,
      [entityType.slice(0, -1)]: entity,
    });
  } catch (error) {
    next(error);
  }
}
