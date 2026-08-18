import { GoalModel, GoalStatus } from './goal.model';
import { z } from 'zod';
import { createGoalSchema, updateGoalSchema } from './goal.validation';

export class GoalService {
  static async createGoal(userId: string, data: z.infer<typeof createGoalSchema>) {
    return GoalModel.create({ ...data, userId });
  }

  static async getGoals(userId: string) {
    const goals = await GoalModel.find({ userId }).sort({ targetDate: 1 }).lean();
    
    return goals.map(goal => ({
      ...goal,
      percentage: Math.min((goal.currentAmount / goal.targetAmount) * 100, 100),
      remainingAmount: Math.max(goal.targetAmount - goal.currentAmount, 0),
    }));
  }

  static async updateGoal(userId: string, goalId: string, data: z.infer<typeof updateGoalSchema>) {
    // If currentAmount reaches targetAmount, auto-complete
    if (data.currentAmount !== undefined) {
      const goal = await GoalModel.findOne({ _id: goalId, userId });
      if (goal && data.currentAmount >= goal.targetAmount) {
        data.status = GoalStatus.COMPLETED;
      }
    }

    const goal = await GoalModel.findOneAndUpdate(
      { _id: goalId, userId },
      { $set: data },
      { new: true }
    );
    if (!goal) throw new Error('Goal not found');
    return goal;
  }

  static async deleteGoal(userId: string, goalId: string) {
    const goal = await GoalModel.findOneAndDelete({ _id: goalId, userId });
    if (!goal) throw new Error('Goal not found');
    return goal;
  }
}
