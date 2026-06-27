import { Router, Request, Response, NextFunction } from 'express';
import { mockLeaderboard } from '../data/mockData';
import config from '../config';
import { getLeaderboard } from '../services/leaderboard.service';

const router = Router();

/**
 * @openapi
 * /api/leaderboard:
 *   get:
 *     summary: Mock leaderboard rankings
 *     tags:
 *       - leaderboard
 *     responses:
 *       200:
 *         description: Top players by rank
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (config.app.dataMode === 'mock') {
      return res.json(mockLeaderboard);
    }

    const result = await getLeaderboard(100, 0);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
