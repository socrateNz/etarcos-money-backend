import { cloudinary, google } from '@/config/third-party.config';
import { ReceiptModel, ReceiptStatus } from './receipt.model';
import { generateText } from 'ai';

const OCR_PROMPT = `Tu es un système d'extraction de données de reçus/factures. Analyse l'image fournie et réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans texte autour), au format exact :
{"store": string, "date": string (ISO 8601), "amount": number, "vat": number, "products": [{"name": string, "price": number, "category": string}]}
Si une information est illisible ou absente, mets null pour cette valeur. Les nombres doivent être des nombres, pas des chaînes.`;

export class ReceiptService {
  /**
   * Uploads base64 image to Cloudinary and saves the Receipt
   */
  static async uploadReceipt(userId: string, base64Image: string) {
    try {
      const uploadResponse = await cloudinary.uploader.upload(base64Image, {
        folder: `etarcos-money/receipts/${userId}`,
      });

      const receipt = await ReceiptModel.create({
        userId,
        cloudinaryUrl: uploadResponse.secure_url,
        status: ReceiptStatus.PENDING,
      });

      return receipt;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload receipt');
    }
  }

  /**
   * Real OCR extraction using Gemini Vision on the uploaded receipt image.
   */
  static async processOcr(receiptId: string) {
    const receipt = await ReceiptModel.findById(receiptId);
    if (!receipt) throw new Error('Receipt not found');

    let ocrData;
    try {
      const { text } = await generateText({
        model: google('gemini-3.5-flash'),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: OCR_PROMPT },
              { type: 'image', image: new URL(receipt.cloudinaryUrl) },
            ],
          },
        ],
      });

      const jsonText = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
      ocrData = JSON.parse(jsonText);
    } catch (error) {
      console.error('Receipt OCR error:', error);
      receipt.status = ReceiptStatus.REJECTED;
      await receipt.save();
      throw new Error('Failed to analyze receipt image');
    }

    receipt.ocrData = ocrData;
    receipt.status = ReceiptStatus.VALIDATED;
    await receipt.save();

    return receipt;
  }
}
