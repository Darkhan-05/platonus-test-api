import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('ai')
@UseGuards(OptionalJwtAuthGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('generate-variants')
    async generateVariants(@Req() req, @Body('questionText') questionText: string) {
        return this.aiService.generateQuestionVariants(req.user?.userId || null, questionText);
    }

    @Post('find-correct-answer')
    async findCorrectAnswer(
        @Req() req,
        @Body('questionText') questionText: string,
        @Body('variants') variants: string[],
    ) {
        const results = await this.aiService.findCorrectAnswersBatch(req.user?.userId || null, [{ text: questionText, variants }]);
        return results[0];
    }

    @Post('batch-find-correct-answers')
    async findCorrectAnswersBatch(
        @Req() req,
        @Body('questions') questions: { text: string, variants: string[] }[],
    ) {
        return this.aiService.findCorrectAnswersBatch(req.user?.userId || null, questions);
    }
}
