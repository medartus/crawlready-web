/**
 * E-E-A-T Checker (Experience, Expertise, Authoritativeness, Trustworthiness)
 * Critical for AI citation likelihood - 52% of AI sources come from top 10 search results where E-E-A-T is key
 */

import type { EEATCheck } from '../types';

export class EEATChecker {
  static check(html: string): EEATCheck {
    const issues: string[] = [];

    const hasAuthorBio = /author|by\s+[a-z]{2,}\s+[a-z]{2,}|written\s+by/i.test(html);
    const hasCredentials = /ph\.?d\.|m\.?d\.|certified|professor|expert/i.test(html);
    const hasAboutPage = /href=["'][^"']*about[^"']*["']/i.test(html);
    const hasContactPage = /href=["'][^"']*contact[^"']*["']/i.test(html);
    const hasPrivacyPolicy = /privacy[\s-]policy/i.test(html);
    const hasSourceCitations = /<sup>|<cite>|\[\d+\]/i.test(html);
    const hasSocialProof = /linkedin\.com|twitter\.com|github\.com/i.test(html);

    const stockPhotoSites = /unsplash\.com|pexels\.com|shutterstock\.com/i;
    const hasOriginalContent = !stockPhotoSites.test(html) && /<img/i.test(html);

    let score = 100;
    if (!hasAuthorBio) {
      score -= 20;
      issues.push('No author bio - critical for E-E-A-T');
    }
    if (!hasCredentials) {
      score -= 15;
    }
    if (!hasAboutPage) {
      score -= 15;
      issues.push('No about page link');
    }
    if (!hasContactPage) {
      score -= 10;
      issues.push('No contact page link');
    }
    if (!hasPrivacyPolicy) {
      score -= 10;
    }
    if (!hasSourceCitations) {
      score -= 20;
      issues.push('No source citations - add references');
    }
    if (!hasSocialProof) {
      score -= 10;
    }

    return {
      hasAuthorBio,
      hasCredentials,
      hasAboutPage,
      hasContactPage,
      hasPrivacyPolicy,
      hasSourceCitations,
      hasSocialProof,
      hasOriginalContent,
      score: Math.max(0, score),
      issues,
    };
  }
}
