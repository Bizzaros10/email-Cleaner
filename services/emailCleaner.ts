import Papa from 'papaparse';
import { EmailRecord, EmailStatus, ProcessingResult } from '../types';
import { EMAIL_REGEX, TYPO_DOMAINS, DISPOSABLE_DOMAINS, ROLE_PREFIXES } from '../constants';

/**
 * Validates a single email string against defined rules.
 */
const validateEmail = (email: string): EmailStatus => {
  if (!email || !email.includes('@')) return EmailStatus.INVALID_FORMAT;

  const lowerEmail = email.toLowerCase().trim();
  
  // 1. Regex Validation
  if (!EMAIL_REGEX.test(lowerEmail)) {
    return EmailStatus.INVALID_FORMAT;
  }

  const [localPart, domain] = lowerEmail.split('@');

  // 2. Typo/Bad Domain Check
  if (TYPO_DOMAINS.has(domain)) {
    return EmailStatus.TYPO_DOMAIN;
  }

  // 3. Disposable Check
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return EmailStatus.DISPOSABLE;
  }

  // 4. Role-Based Check
  if (ROLE_PREFIXES.has(localPart)) {
    return EmailStatus.ROLE_BASED;
  }

  return EmailStatus.VALID;
};

/**
 * Processes a File object to extract data.
 */
const parseFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error),
    });
  });
};

/**
 * Main function to ingest, consolidate, and clean data.
 */
export const processFiles = async (files: File[]): Promise<ProcessingResult> => {
  let allRecords: any[] = [];

  // 1. Ingestion & Consolidation
  for (const file of files) {
    try {
      const data = await parseFile(file);
      // Attach source for tracking
      const enrichedData = data.map((row: any) => ({ ...row, _sourceFile: file.name }));
      allRecords = [...allRecords, ...enrichedData];
    } catch (err) {
      console.error(`Error parsing file ${file.name}`, err);
    }
  }

  const uniqueEmails = new Set<string>();
  const processedRecords: EmailRecord[] = [];
  const stats = {
    totalProcessed: 0,
    totalValid: 0,
    totalDuplicates: 0,
    invalidBreakdown: {
      [EmailStatus.INVALID_FORMAT]: 0,
      [EmailStatus.DISPOSABLE]: 0,
      [EmailStatus.ROLE_BASED]: 0,
      [EmailStatus.TYPO_DOMAIN]: 0,
      [EmailStatus.DUPLICATE]: 0,
      [EmailStatus.MISSING_MX]: 0,
      [EmailStatus.VALID]: 0, // Should stay 0 in breakdown, but kept for type safety
    }
  };

  // Find the email column dynamically
  // We look for a key that looks like 'email'
  const findEmailKey = (row: any): string | null => {
    const keys = Object.keys(row);
    return keys.find(k => k.toLowerCase().includes('email')) || null;
  };

  // 2. Iteration & Cleaning
  for (const row of allRecords) {
    stats.totalProcessed++;
    
    const emailKey = findEmailKey(row);
    const rawEmail = emailKey ? String(row[emailKey]) : '';
    const normalizedEmail = rawEmail.toLowerCase().trim();

    let status = EmailStatus.VALID;

    if (!rawEmail) {
      status = EmailStatus.INVALID_FORMAT;
    } else if (uniqueEmails.has(normalizedEmail)) {
      status = EmailStatus.DUPLICATE;
    } else {
      // Run validation logic
      status = validateEmail(normalizedEmail);
      if (status === EmailStatus.VALID) {
         // Only add to set if it's potentially valid to allow re-checking invalid ones if needed
         // But usually, we only care about unique valid ones. 
         // For a strict unique list, we add everything to the Set.
         uniqueEmails.add(normalizedEmail);
      } else {
        // We also track duplicates of invalid emails? 
        // Blueprint says "Deduplication... Remove any rows where email is repeated".
        // So we add to set regardless.
        uniqueEmails.add(normalizedEmail);
      }
    }

    // Update Stats
    if (status === EmailStatus.VALID) {
      stats.totalValid++;
    } else {
      if (status === EmailStatus.DUPLICATE) stats.totalDuplicates++;
      stats.invalidBreakdown[status] = (stats.invalidBreakdown[status] || 0) + 1;
    }

    processedRecords.push({
      original: rawEmail,
      email: normalizedEmail,
      status,
      sourceFile: row._sourceFile,
      ...row // Keep original data
    });
  }

  return {
    stats,
    validRecords: processedRecords.filter(r => r.status === EmailStatus.VALID),
    invalidRecords: processedRecords.filter(r => r.status !== EmailStatus.VALID),
  };
};

export const downloadCSV = (data: EmailRecord[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};