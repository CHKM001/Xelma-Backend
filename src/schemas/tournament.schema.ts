import { z } from "zod";

export const joinTournamentParamsSchema = z.object({
  id: z.string().min(1, "Tournament ID is required"),
});

export type JoinTournamentParams = z.infer<typeof joinTournamentParamsSchema>;
