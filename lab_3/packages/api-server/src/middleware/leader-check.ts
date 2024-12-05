import { Request, Response, NextFunction } from "express";

let isLeader = false;

export const setLeaderStatus = (status: boolean) => {
  isLeader = status;
};

export const leaderCheck = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!isLeader) {
    res
      .status(403)
      .json({ message: "Only the leader can perform this action" });
    return;
  }

  next();
};
