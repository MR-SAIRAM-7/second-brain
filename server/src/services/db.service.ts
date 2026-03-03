import { Db, MongoClient, Collection, ObjectId } from 'mongodb';

type KnowledgeDoc = {
    _id?: ObjectId;
    title: string;
    content: string;
    type: string;
    sourceUrl?: string;
    tags: string[];
    summary?: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    metadata?: Record<string, unknown>;
};

type UserDoc = {
    _id?: ObjectId;
    email: string;
    passwordHash: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    preferences?: {
        theme?: 'dark' | 'light';
        autoSummarize?: boolean;
        defaultTags?: string[];
    };
};

let client: MongoClient | null = null;
let db: Db | null = null;

const getMongoUri = () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not configured');
    return uri;
};

export async function getDb(): Promise<Db> {
    if (db) return db;
    const uri = getMongoUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
    return db;
}

export async function getKnowledgeCollection(): Promise<Collection<KnowledgeDoc>> {
    const database = await getDb();
    return database.collection<KnowledgeDoc>('knowledge_items');
}

export async function getUsersCollection(): Promise<Collection<UserDoc>> {
    const database = await getDb();
    return database.collection<UserDoc>('users');
}

export const toItem = (doc: KnowledgeDoc) => ({
    id: doc._id?.toString() || '',
    title: doc.title,
    content: doc.content,
    type: doc.type,
    sourceUrl: doc.sourceUrl,
    tags: doc.tags,
    summary: doc.summary,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    userId: doc.userId,
    metadata: doc.metadata,
});

export const toUser = (doc: UserDoc) => ({
    id: doc._id?.toString() || '',
    email: doc.email,
    name: doc.name,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    preferences: {
        theme: doc.preferences?.theme === 'light' ? 'light' : 'dark',
        autoSummarize: doc.preferences?.autoSummarize ?? true,
        defaultTags: doc.preferences?.defaultTags ?? [],
    },
});
