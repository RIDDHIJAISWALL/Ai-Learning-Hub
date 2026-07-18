import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';

async function run() {
  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await textSplitter.splitText("This is a test document. ".repeat(100));

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.GEMINI_API_KEY,
      configuration: { baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/" },
      modelName: "gemini-embedding-2"
    });

    const vectors = await embeddings.embedDocuments(chunks);
    console.log("SUCCESS:", vectors.length);
  } catch(e) {
    console.error("ERROR:", e);
  }
}
run();
