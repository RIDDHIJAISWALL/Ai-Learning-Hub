const { OpenAI } = require('openai');
const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
});

async function test() {
  try {
    const chat = await openai.chat.completions.create({
      model: 'gemini-3.5-flash',
      messages: [{role: 'user', content: 'Say hi'}],
      response_format: { type: 'json_object' }
    });
    console.log('JSON MODE SUCCESS:', chat.choices[0].message);
  } catch (e) { console.error('JSON MODE ERROR:', e.message); }

  try {
    const emb = await openai.embeddings.create({
      model: 'gemini-embedding-2',
      input: 'hello'
    });
    console.log('EMBEDDING SUCCESS:', emb.data[0].embedding.length);
  } catch (e) { console.error('EMBEDDING ERROR:', e.message); }
}
test();
