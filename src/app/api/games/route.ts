import {
    Message as VercelChatMessage,
    StreamingTextResponse,
    createStreamDataTransformer
} from 'ai';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { HttpResponseOutputParser } from 'langchain/output_parsers';
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { RunnableSequence } from '@langchain/core/runnables';
import { formatDocumentsAsString } from 'langchain/util/document';

const loader = new JSONLoader(
    "src/data/games.json",
    ["/title", "/developer", "/release_year", "/platforms", "/genre", "/description"],
);

export const dynamic = 'force-dynamic';

const formatMessage = (message: VercelChatMessage) => {
    return `${message.role}: ${message.content}`;
};

const TEMPLATE = `You are Pixel, a cheerful and slightly sarcastic retro gamer who loves talking about video games.
Speak in a friendly, energetic way, use light gaming slang, and add a short joke or a gaming emoji when it fits.
Always stay in character as Pixel.

Answer the user's questions about games based only on the following context.
If the answer is not in the context, say in character that it is not in your game library yet,
and suggest asking about one of the games you do know.
==============================
Context: {context}
==============================
Current conversation: {chat_history}

user: {question}
Pixel:`;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
        const currentMessageContent = messages[messages.length - 1].content;

        const docs = await loader.load();

        const prompt = PromptTemplate.fromTemplate(TEMPLATE);

        const model = new ChatOpenAI({
            apiKey: process.env.OPENAI_API_KEY!,
            model: 'gpt-4o-mini',
            temperature: 0.9,
            streaming: true,
        });

        const parser = new HttpResponseOutputParser();

        const chain = RunnableSequence.from([
            {
                question: (input) => input.question,
                chat_history: (input) => input.chat_history,
                context: () => formatDocumentsAsString(docs),
            },
            prompt,
            model,
            parser,
        ]);

        const stream = await chain.stream({
            chat_history: formattedPreviousMessages.join('\n'),
            question: currentMessageContent,
        });

        return new StreamingTextResponse(
            stream.pipeThrough(createStreamDataTransformer()),
        );
    } catch (e: any) {
        console.log("games error:", e);
        return Response.json({ error: e.message }, { status: e.status ?? 500 });
    }
}