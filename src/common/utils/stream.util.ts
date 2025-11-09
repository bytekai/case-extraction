import { Readable } from 'node:stream';

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks = await stream.toArray();
    const buffers = chunks.map((chunk) => {
        if (Buffer.isBuffer(chunk)) {
            return chunk;
        }
        if (typeof chunk === 'string') {
            return Buffer.from(chunk, 'utf-8');
        }
        return Buffer.from(String(chunk), 'utf-8');
    });
    return Buffer.concat(buffers);
}

