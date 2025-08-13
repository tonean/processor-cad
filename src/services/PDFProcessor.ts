// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - disable worker to avoid CORS issues
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  // @ts-ignore
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  console.log('PDF.js worker disabled to avoid CORS issues - processing will run in main thread');
}
export interface PDFContent {
  text: string;
  images: string[];
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    pageCount: number;
  };
  pages: PDFPage[];
}

export interface PDFPage {
  pageNumber: number;
  text: string;
  images: string[];
}

export class PDFProcessor {
  private static instance: PDFProcessor;

  private constructor() {}

  public static getInstance(): PDFProcessor {
    if (!PDFProcessor.instance) {
      PDFProcessor.instance = new PDFProcessor();
    }
    return PDFProcessor.instance;
  }

  public async processPDF(file: File | Blob | ArrayBuffer | string): Promise<PDFContent> {
    try {
      let pdfData: ArrayBuffer | string;
      
      if (file instanceof File || file instanceof Blob) {
        pdfData = await this.fileToArrayBuffer(file);
      } else if (typeof file === 'string') {
        // If it's a base64 string or URL
        if (file.startsWith('data:')) {
          // Extract base64 data from data URL
          const base64 = file.split(',')[1];
          pdfData = this.base64ToArrayBuffer(base64);
        } else {
          // Assume it's a URL
          const response = await fetch(file);
          pdfData = await response.arrayBuffer();
        }
      } else {
        pdfData = file;
      }

      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      
      // Extract metadata
      const metadata = await this.extractMetadata(pdf);
      
      // Process all pages
      const pages: PDFPage[] = [];
      let fullText = '';
      const allImages: string[] = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        
        // Extract text
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        // Extract images
        const pageImages = await this.extractImagesFromPage(page);
        
        pages.push({
          pageNumber: pageNum,
          text: pageText,
          images: pageImages
        });
        
        fullText += pageText + '\n\n';
        allImages.push(...pageImages);
      }
      
      return {
        text: fullText,
        images: allImages,
        metadata,
        pages
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractMetadata(pdf: any): Promise<PDFContent['metadata']> {
    try {
      const metadata = await pdf.getMetadata();
      
      return {
        title: metadata.info?.Title || undefined,
        author: metadata.info?.Author || undefined,
        subject: metadata.info?.Subject || undefined,
        keywords: metadata.info?.Keywords || undefined,
        pageCount: pdf.numPages
      };
    } catch (error) {
      console.warn('Could not extract metadata:', error);
      return {
        pageCount: pdf.numPages
      };
    }
  }

  private async extractImagesFromPage(page: any): Promise<string[]> {
    // Simplified version - image extraction from PDFs is complex
    // For now, we'll focus on text extraction
    // Full image extraction would require more complex handling
    return [];
  }

  private fileToArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  public extractKeyPhrases(text: string): string[] {
    // Simple keyword extraction
    const keywords: string[] = [];
    
    // Technical terms to look for
    const technicalTerms = [
      'MEMS', 'laser', 'hologram', 'mirror', 'SLM', 'spatial light modulator',
      'diffraction', 'interference', 'wavelength', 'optical', 'photonic',
      'micro-electro-mechanical', 'beam steering', 'phase modulation',
      'amplitude modulation', 'Fourier transform', 'CGH', 'computer-generated hologram',
      'pixel', 'resolution', 'focal length', 'aperture', 'lens', 'detector',
      'silicon', 'fabrication', 'lithography', 'etching', 'deposition'
    ];
    
    const lowerText = text.toLowerCase();
    
    technicalTerms.forEach(term => {
      if (lowerText.includes(term.toLowerCase())) {
        keywords.push(term);
      }
    });
    
    // Extract numerical specifications (e.g., "632.8 nm", "10 μm")
    const specPattern = /\d+(?:\.\d+)?\s*(?:nm|μm|um|mm|cm|m|Hz|kHz|MHz|GHz|mW|W|V|mV|°|degrees)/gi;
    const specs = text.match(specPattern);
    if (specs) {
      keywords.push(...specs);
    }
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  public extractEquations(text: string): string[] {
    const equations: string[] = [];
    
    // Look for LaTeX equations
    const latexPattern = /\$[^\$]+\$|\\[[^\\]]+\\]|\\\([^)]+\\\)/g;
    const latexEquations = text.match(latexPattern);
    if (latexEquations) {
      equations.push(...latexEquations);
    }
    
    // Look for common equation patterns
    const equationPattern = /[A-Za-z]+\s*=\s*[^.;\n]+/g;
    const simpleEquations = text.match(equationPattern);
    if (simpleEquations) {
      equations.push(...simpleEquations);
    }
    
    return equations;
  }

  public extractDimensions(text: string): Array<{ value: number; unit: string; context: string }> {
    const dimensions: Array<{ value: number; unit: string; context: string }> = [];
    
    // Pattern to match dimensions with context
    const dimPattern = /(\d+(?:\.\d+)?)\s*(nm|μm|um|mm|cm|m)\b([^.]*)/gi;
    let match;
    
    while ((match = dimPattern.exec(text)) !== null) {
      const value = parseFloat(match[1]);
      const unit = match[2];
      const context = match[3].substring(0, 50); // Get some context
      
      dimensions.push({ value, unit, context });
    }
    
    return dimensions;
  }
}
