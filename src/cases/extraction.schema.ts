import { z } from 'zod';

export const languageCodeEnum = z.enum(['da', 'en']);

export type LanguageCode = z.infer<typeof languageCodeEnum>;

const decisionTypesByLanguageCode = {
    da: ['DOM', 'KENDELSE', 'BESLUTNING', 'AFGØRELSE', 'ANDET'] as const,
    en: ['JUDGMENT', 'ORDER', 'RULING', 'OPINION', 'DECISION', 'OTHER'] as const,
} as const satisfies {
    [K in LanguageCode]: readonly string[];
};

export type DecisionTypesByLanguageCode = typeof decisionTypesByLanguageCode;

function getDecisionTypesForLanguage<T extends LanguageCode>(
    language: T,
): readonly string[] {
    return decisionTypesByLanguageCode[language];
}

function getDecisionTypeEnumForLanguage<T extends LanguageCode>(
    language: T,
): z.ZodEnum<[string, ...string[]]> {
    const decisionTypes = getDecisionTypesForLanguage(language);
    const tuple = [...decisionTypes] as [string, ...string[]];
    return z.enum(tuple);
}

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

const baseSchemaFields = {
    title: z.string(),
    dateOfDecision: z.union([
        z.string().regex(dateOnlyRegex, 'Date must be in YYYY-MM-DD format (date only, no time)'),
        z.null(),
    ]),
    office: z.union([z.string(), z.null()]),
    court: z.union([z.string(), z.null()]),
    caseNumber: z.union([z.string(), z.null()]),
    summary: z.string().describe('A concise summary (200-500 words) covering: the factual background and key events, main parties involved, the legal issues addressed, essential procedural history, main legal arguments, and relevant legal principles cited. Should provide sufficient context to understand the case without excessive detail.'),
    conclusion: z.string().describe('A concise conclusion (100-300 words) covering: the decision or outcome, key orders or relief granted, essential conditions or limitations, important deadlines, and appeal rights if mentioned. Should focus on actionable information for legal professionals.'),
};

export function buildSchema<T extends LanguageCode>(language: T): z.ZodObject<{
    title: z.ZodString;
    dateOfDecision: z.ZodUnion<[z.ZodString, z.ZodNull]>;
    office: z.ZodUnion<[z.ZodString, z.ZodNull]>;
    court: z.ZodUnion<[z.ZodString, z.ZodNull]>;
    caseNumber: z.ZodUnion<[z.ZodString, z.ZodNull]>;
    summary: z.ZodString;
    conclusion: z.ZodString;
    decisionType: z.ZodEnum<[string, ...string[]]>;
}> {
    const decisionTypeEnum = getDecisionTypeEnumForLanguage(language);
    return z.object({
        ...baseSchemaFields,
        decisionType: decisionTypeEnum,
    });
}
export const extractionSchema = buildSchema('da');

export type ExtractionResult = z.infer<typeof extractionSchema>;

export type DecisionType<T extends LanguageCode = LanguageCode> =
    DecisionTypesByLanguageCode[T][number];
