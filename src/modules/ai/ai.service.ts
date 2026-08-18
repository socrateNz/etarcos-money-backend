import { generateText } from 'ai';
import { google } from '@/config/third-party.config';
import { ChatHistoryModel } from './chat-history.model';
import { DashboardService } from '../dashboard/dashboard.service';
import { UserModel } from '../users/user.model';

export class AiService {
  static async chat(userId: string, message: string) {
    // 1. Fetch User Data to give Context to AI
    const user = await UserModel.findById(userId);
    const dashboardData = await DashboardService.getDashboardData(userId);

    // 2. Fetch Chat History
    let history = await ChatHistoryModel.findOne({ userId });
    if (!history) {
      history = new ChatHistoryModel({ userId, messages: [] });
    }

    const systemPrompt = `Tu es Tacynt Money AI, un assistant financier expert.
L'utilisateur s'appelle ${user?.firstName || 'Utilisateur'}.
Ton ton de communication préféré par l'utilisateur est : ${user?.aiPreferences?.tone || 'friendly'}.
Voici le contexte financier de l'utilisateur :
- Solde total : ${dashboardData.totalBalance}
- Revenus ce mois : ${dashboardData.incomeThisMonth}
- Dépenses ce mois : ${dashboardData.expenseThisMonth}
- Dépenses par catégorie : ${JSON.stringify(dashboardData.expensesByCategory)}

Réponds toujours de manière claire, concise, et apporte des conseils financiers avisés.`;

    // 3. Format messages for Vercel AI SDK
    const previousMessages = history.messages.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const currentMessages = [
      ...previousMessages,
      { role: 'user' as const, content: message },
    ];

    // 4. Call Google Gemini via Vercel AI SDK
    let aiResponseText = '';
    try {
      const { text } = await generateText({
        model: google('gemini-3.5-flash'),
        system: systemPrompt,
        messages: currentMessages,
      });
      aiResponseText = text;
    } catch (error) {
      console.error('AI Error:', error);
      aiResponseText = "Désolé, je rencontre des difficultés de connexion avec mon réseau neuronal. Veuillez réessayer plus tard.";
    }

    // 5. Save History
    history.messages.push({ role: 'user', content: message, createdAt: new Date() });
    history.messages.push({ role: 'assistant', content: aiResponseText, createdAt: new Date() });
    await history.save();

    return {
      message: aiResponseText,
    };
  }
}
