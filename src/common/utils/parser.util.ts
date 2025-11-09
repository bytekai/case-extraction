import { Readable } from 'node:stream';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import { streamToBuffer } from './stream.util';
import { getErrorMessage } from './error.util';

export async function parseHtml(stream: Readable): Promise<Readable> {
    const buffer = await streamToBuffer(stream);
    const htmlContent = buffer.toString('utf-8');
    const $ = cheerio.load(htmlContent);
    $('script, style, noscript, iframe, embed, object, link').remove();
    $('*').removeAttr('style');
    const cleanedHtml = $.html();
    return Readable.from([cleanedHtml]);
}

export async function parsePdf(stream: Readable): Promise<Readable> {
    const pdfBuffer = await streamToBuffer(stream);

    try {
        const pdfData = await pdfParse(pdfBuffer);
        const extractedText = pdfData.text;

        const cleanedText = extractedText
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        return Readable.from([cleanedText]);
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        throw new Error(`PDF parsing failed: ${errorMessage}`);
    }
}

