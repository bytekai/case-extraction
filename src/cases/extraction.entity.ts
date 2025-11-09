import { ObjectType, Field, ID, registerEnumType, Int } from '@nestjs/graphql';
import { FileType } from '@prisma/client';

registerEnumType(FileType, {
    name: 'FileType',
});

@ObjectType()
export class Extraction {
    @Field(() => ID)
        id!: string;
    @Field(() => FileType, { nullable: true })
        fileType!: FileType | null;
    @Field(() => String, { nullable: true })
        originalFileName!: string | null;
    @Field(() => String)
        source!: string;
    @Field(() => String)
        title!: string;
    @Field(() => String)
        decisionType!: string;
    @Field(() => String, { nullable: true })
        dateOfDecision!: string | null;
    @Field(() => String, { nullable: true })
        office!: string | null;
    @Field(() => String, { nullable: true })
        court!: string | null;
    @Field(() => String, { nullable: true })
        caseNumber!: string | null;
    @Field(() => String)
        summary!: string;
    @Field(() => String)
        conclusion!: string;
    @Field(() => String)
        language!: string;
    @Field(() => Date)
        createdAt!: Date;
    @Field(() => Date)
        updatedAt!: Date;
}

@ObjectType()
export class ExtractionPaginationResult {
    @Field(() => [Extraction])
        items!: Extraction[];
    @Field(() => Int)
        total!: number;
    @Field(() => Int)
        limit!: number;
    @Field(() => Int)
        offset!: number;
    @Field(() => Boolean)
        hasMore!: boolean;
}

