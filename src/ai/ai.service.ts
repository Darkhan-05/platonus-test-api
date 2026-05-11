import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AiService {
    private readonly deepseekApiKey: string;
    private readonly dailyLimit = 2000;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.deepseekApiKey = this.configService.getOrThrow<string>('DEEPSEEK_API_KEY');
    }

    private async checkAndIncrementLimit(userId: string, count: number = 1) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');

        const now = new Date();
        const lastRequestAt = new Date(user.lastRequestAt);

        let currentCount = user.dailyRequestCount;

        // Reset count if it's a new day
        if (
            now.getFullYear() !== lastRequestAt.getFullYear() ||
            now.getMonth() !== lastRequestAt.getMonth() ||
            now.getDate() !== lastRequestAt.getDate()
        ) {
            currentCount = 0;
            // Also reset count in DB if it's a new day
            await this.prisma.user.update({
                where: { id: userId },
                data: { dailyRequestCount: 0 }
            });
        }

        if (currentCount + count > this.dailyLimit) {
            throw new ForbiddenException(`Daily AI request limit reached (2000/day). You have ${this.dailyLimit - currentCount} requests left.`);
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                dailyRequestCount: { increment: count },
                lastRequestAt: now,
            },
        });
    }

    async generateQuestionVariants(userId: string, questionText: string) {
        await this.checkAndIncrementLimit(userId);

        const prompt = `
    You are a quiz engine backend.
    For the question: "${questionText}"
    
    Generate 1 correct answer and 3 incorrect answers.
    
    CRITICAL OUTPUT FORMAT RULES:
    1. Do NOT use A), B), C), D) numbering.
    2. Do NOT use markdown or bold text.
    3. Start every answer with the tag "<variant>".
    4. The first variant MUST be the correct one.
    
    Example output format:
    <variant> Paris
    <variant> London
    <variant> Berlin
    <variant> Madrid
    `;

        try {
            const response = await axios.post(
                'https://api.deepseek.com/chat/completions',
                {
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: prompt }],
                    stream: false,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.deepseekApiKey}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            const text = response.data.choices[0].message.content;
            const variants = text
                .split('<variant>')
                .map((v: string) => v.trim())
                .filter((v: string) => v.length > 0);

            if (variants.length >= 4) {
                return variants.slice(0, 4);
            }
            return variants;
        } catch (error) {
            console.error('DeepSeek AI Error:', error.response?.data || error.message);
            throw new BadRequestException('Failed to generate variants from AI');
        }
    }

    async findCorrectAnswersBatch(userId: string, questions: { text: string, variants: string[] }[]) {
        if (questions.length === 0) return [];
        await this.checkAndIncrementLimit(userId, 1); // Batch counts as 1 AI operation for simplicity or use questions.length

        const batchPrompt = questions.map((q, i) => `
Question ${i + 1}: "${q.text}"
Variants:
${q.variants.map((v, vi) => `${vi + 1}. ${v}`).join('\n')}
`).join('\n---\n');

        const prompt = `
You are a quiz assistant. Identify the correct answer for EACH question below.
Return ONLY a JSON array of 1-based indexes of the correct variants.
Example Output: [1, 4, 2, 3]

Questions:
${batchPrompt}
`;

        try {
            const response = await axios.post(
                'https://api.deepseek.com/chat/completions',
                {
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: prompt }],
                    stream: false,
                    response_format: { type: 'json_object' }
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.deepseekApiKey}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            const content = response.data.choices[0].message.content;
            // Extract array from JSON (DeepSeek might wrap it in an object if forced to json_object)
            const match = content.match(/\[.*\]/s);
            if (match) {
                const indexes = JSON.parse(match[0]);
                return indexes.map((idx: number) => idx - 1); // 0-based
            }
            return questions.map(() => 0);
        } catch (error) {
            console.error('DeepSeek AI Batch Error:', error.response?.data || error.message);
            throw new BadRequestException('Failed to process batch from AI');
        }
    }
}
