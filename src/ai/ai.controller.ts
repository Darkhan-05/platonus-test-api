import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('generate-variants')
    async generateVariants(@Req() req, @Body('questionText') questionText: string) {
        return this.aiService.generateQuestionVariants(req.user.userId, questionText);
    }

    @Post('find-correct-answer')
    async findCorrectAnswer(
        @Req() req,
        @Body('questionText') questionText: string,
        @Body('variants') variants: string[],
    ) {
        // Compatibility wrapper for single question using the batch logic
        const results = await this.aiService.findCorrectAnswersBatch(req.user.userId, [{ text: questionText, variants }]);
        return results[0];
    }

    @Post('batch-find-correct-answers')
    async findCorrectAnswersBatch(
        @Req() req,
        @Body('questions') questions: { text: string, variants: string[] }[],
    ) {
        return this.aiService.findCorrectAnswersBatch(req.user.userId, questions);
    }
}
