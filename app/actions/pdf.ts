'use server';

import * as pdfParseModule from 'pdf-parse';
const pdfParse = (pdfParseModule as any).default || pdfParseModule;

export async function parsePdf(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file provided');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await pdfParse(buffer);

    // Clean up whitespace
    const cleanContent = data.text.replace(/\s+/g, ' ').trim();

    return { success: true, title: file.name, content: cleanContent };
  } catch (error: any) {
    console.error('PDF Parse Error:', error);
    return { success: false, error: error.message || 'Failed to parse PDF' };
  }
}
