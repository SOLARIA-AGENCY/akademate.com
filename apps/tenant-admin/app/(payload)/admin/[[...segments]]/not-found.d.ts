import type { Metadata } from 'next';
import { NotFoundPage } from '@payloadcms/next/views';
type Args = {
    params: Promise<{
        segments: string[];
    }>;
    searchParams: Promise<{
        [key: string]: string | string[];
    }>;
};
export declare const generateMetadata: ({ params, searchParams }: Args) => Promise<Metadata>;
export default NotFoundPage;
//# sourceMappingURL=not-found.d.ts.map