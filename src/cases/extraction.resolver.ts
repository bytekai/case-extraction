import { Resolver, Query, Args } from '@nestjs/graphql';
import { ExtractionService } from './extraction.service';
import { Extraction, ExtractionPaginationResult } from './extraction.entity';
import { ExtractionFilter, ExtractionSort, PaginationInput } from './extraction.inputs';

@Resolver(() => Extraction)
export class ExtractionResolver {
    constructor(private extractionService: ExtractionService) { }

    @Query(() => Extraction, { nullable: true })
    async extraction(
        @Args('id') id: string,
    ): Promise<Extraction | null> {
        return this.extractionService.findById(id);
    }

    @Query(() => ExtractionPaginationResult)
    async extractions(
        @Args('filter', { nullable: true }) filter?: ExtractionFilter,
        @Args('sort', { nullable: true }) sort?: ExtractionSort,
        @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    ): Promise<ExtractionPaginationResult> {
        return this.extractionService.findAll(filter, sort, pagination);
    }
}
