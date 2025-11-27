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
 * Helper to extract a normalized name from a row
 */
const extractName = (row: any): string => {
  const keys = Object.keys(row);
  const lowerKeys = keys.map(k => k.toLowerCase());
  
  // 1. Check for exact Name/Full Name matches
  if (lowerKeys.includes('name')) return row[keys[lowerKeys.indexOf('name')]] || '';
  if (lowerKeys.includes('full name')) return row[keys[lowerKeys.indexOf('full name')]] || '';
  if (lowerKeys.includes('fullname')) return row[keys[lowerKeys.indexOf('fullname')]] || '';
  
  // 2. Check for First Name + Last Name combination
  const firstIdx = lowerKeys.findIndex(k => k === 'first name' || k === 'firstname');
  const lastIdx = lowerKeys.findIndex(k => k === 'last name' || k === 'lastname');
  
  if (firstIdx !== -1 && lastIdx !== -1) {
      const first = row[keys[firstIdx]] || '';
      const last = row[keys[lastIdx]] || '';
      return `${first} ${last}`.trim();
  }
  
  // 3. Fallback to just First Name if available
  if (firstIdx !== -1) return row[keys[firstIdx]] || '';
  
  // 4. Fuzzy search for any key with 'name' (excluding email/file)
  const fuzzyKey = keys.find(k => {
      const lower = k.toLowerCase();
      return lower.includes('name') && !lower.includes('email') && !lower.includes('file');
  });
  
  return fuzzyKey ? row[fuzzyKey] || '' : '';
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
      [EmailStatus.VALID]: 0,
    }
  };

  // Find the email column dynamically
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
    const name = extractName(row);

    let status = EmailStatus.VALID;

    if (!rawEmail) {
      status = EmailStatus.INVALID_FORMAT;
    } else if (uniqueEmails.has(normalizedEmail)) {
      status = EmailStatus.DUPLICATE;
    } else {
      status = validateEmail(normalizedEmail);
      uniqueEmails.add(normalizedEmail);
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
      name: name,
      status,
      sourceFile: row._sourceFile,
      ...row 
    });
  }

  return {
    stats,
    validRecords: processedRecords.filter(r => r.status === EmailStatus.VALID),
    invalidRecords: processedRecords.filter(r => r.status !== EmailStatus.VALID),
  };
};

export const downloadCSV = (data: EmailRecord[], filename: string, columns: string[] = []) => {
  // Filter data to only include requested columns if specified
  const exportData = columns.length > 0 
    ? data.map(record => {
        const filtered: any = {};
        columns.forEach(col => {
          // Map to capitalized headers for specific fields
          let header = col;
          if (col === 'email') header = 'Email';
          if (col === 'name') header = 'Name';
          if (col === 'status') header = 'Status';
          
          filtered[header] = record[col as keyof EmailRecord] || '';
        });
        return filtered;
      })
    : data;

  const csv = Papa.unparse(exportData);
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