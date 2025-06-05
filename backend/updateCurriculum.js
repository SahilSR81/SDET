// updateCurriculum.js
// Usage: node updateCurriculum.js
// Requires: OPENAI_API_KEY and GOOGLE_APPLICATION_CREDENTIALS env vars

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fetch = require('node-fetch');

if (!process.env.OPENAI_API_KEY) {
  console.error('Set OPENAI_API_KEY in your environment.');
  process.exit(1);
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service account key JSON file.');
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function main() {
  const prompt =
    'Generate a JSON array of the latest SDET (Software Development Engineer in Test) curriculum topics and for each topic, provide a title, a short summary, and 3-5 recommended subtopics. Only output valid JSON.';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert SDET curriculum designer.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    }),
  });
  const data = await response.json();
  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) {
    throw new Error('No content from OpenAI');
  }
  let curriculum;
  try {
    curriculum = JSON.parse(content);
  } catch (e) {
    throw new Error('Failed to parse OpenAI response as JSON');
  }
  await db.collection('curriculum').doc('latest').set({
    updated: new Date().toISOString(),
    topics: curriculum,
  });
  console.log('Curriculum updated in Firestore!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}); 