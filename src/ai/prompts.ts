export const PROMPTS = {
  summarize: (content: string): string => {
    return `Please provide a concise summary of the following note in 5-7 bullet points. Focus on the key points and main ideas:

${content}

Summary:`;
  },

  generateTags: (content: string): string => {
    return `Analyze the following note and return ONLY a JSON array of 3-8 lowercase tags that best describe its content. Do not include any other text, only the JSON array.

Example format: ["tag1", "tag2", "tag3"]

Note content:
${content}

Tags (JSON array only):`;
  },
};
