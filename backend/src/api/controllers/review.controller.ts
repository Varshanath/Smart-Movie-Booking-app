import { NextFunction, Request, Response } from "express";

import { addMovieReview, getMovieReviews, getUserReviews } from "../../modules/reviews/review.service";

export async function listMovieReviewsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ reviews: await getMovieReviews(request.params.movieId) });
  } catch (error) {
    next(error);
  }
}

export async function createMovieReviewController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const review = await addMovieReview(request.params.movieId, request.body);
    response.status(201).json({ message: "Review created successfully", review });
  } catch (error) {
    next(error);
  }
}

export async function listUserReviewsController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({ reviews: await getUserReviews(request.params.userId) });
  } catch (error) {
    next(error);
  }
}
