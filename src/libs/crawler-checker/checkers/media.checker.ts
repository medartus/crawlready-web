/**
 * Media Optimization Checker
 * Images and videos are critical for AI understanding and accessibility
 */

import type { MediaCheck } from '../types';

export class MediaChecker {
  static check(html: string): MediaCheck {
    const issues: string[] = [];

    // Extract all images
    const images = html.match(/<img[^>]*>/gi) || [];
    const imageCount = images.length;

    let imagesWithAlt = 0;
    let imagesWithoutAlt = 0;
    let altTooShort = 0;
    let altTooLong = 0;
    let altOptimal = 0;
    let imageDimensionsSpecified = 0;

    // Check each image
    images.forEach((img) => {
      // Alt text validation
      const altMatch = img.match(/alt=["']([^"']*)["']/i);

      if (altMatch) {
        imagesWithAlt++;
        const altText = altMatch[1];
        const altLength = altText?.length || 0;

        if (altLength === 0) {
          // Empty alt is valid for decorative images
        } else if (altLength < 10) {
          altTooShort++;
          issues.push('Image alt text too short (< 10 chars)');
        } else if (altLength > 125) {
          altTooLong++;
          issues.push(`Image alt text too long (${altLength} chars, should be < 125)`);
        } else {
          altOptimal++;
        }
      } else {
        imagesWithoutAlt++;
      }

      // Dimensions check
      if (img.includes('width=') && img.includes('height=')) {
        imageDimensionsSpecified++;
      }
    });

    // Modern format detection
    const webpCount = (html.match(/\.webp["'\s>]/gi) || []).length;
    const avifCount = (html.match(/\.avif["'\s>]/gi) || []).length;
    const svgCount = (html.match(/\.svg["'\s>]/gi) || []).length;

    // Lazy loading detection
    const lazyLoadingUsed = /loading=["']lazy["']/i.test(html);

    // Responsive images (srcset)
    const responsiveImagesUsed = /srcset=["']/i.test(html);

    // Video validation
    const videos = html.match(/<video[^>]*>/gi) || [];
    const videoCount = videos.length;

    // Check for VideoObject schema
    let videosWithSchema = 0;
    const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

    if (jsonLdMatches) {
      jsonLdMatches.forEach((match) => {
        try {
          const jsonStr = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          const schema = JSON.parse(jsonStr) as { '@type'?: string };

          if (schema['@type'] === 'VideoObject') {
            videosWithSchema++;
          }
        } catch {
          // Invalid JSON, skip
        }
      });
    }

    // Issues reporting
    if (imagesWithoutAlt > 0) {
      issues.push(`${imagesWithoutAlt} images missing alt text (accessibility & AI understanding)`);
    }

    if (imageCount > 0 && webpCount === 0 && avifCount === 0) {
      issues.push('No modern image formats (WebP, AVIF) detected - use for faster loading');
    }

    if (imageCount > 5 && !lazyLoadingUsed) {
      issues.push('Consider lazy loading for below-fold images');
    }

    if (imageCount > 3 && !responsiveImagesUsed) {
      issues.push('No responsive images (srcset) detected - important for mobile');
    }

    if (imageDimensionsSpecified < imageCount) {
      issues.push(`${imageCount - imageDimensionsSpecified} images missing width/height (causes layout shift)`);
    }

    if (videoCount > 0 && videosWithSchema === 0) {
      issues.push('Videos present but missing VideoObject schema');
    }

    return {
      imageCount,
      imagesWithAlt,
      imagesWithoutAlt,
      altTextQuality: {
        tooShort: altTooShort,
        tooLong: altTooLong,
        optimal: altOptimal,
      },
      modernFormats: {
        webp: webpCount,
        avif: avifCount,
        svg: svgCount,
      },
      lazyLoadingUsed,
      responsiveImagesUsed,
      imageDimensionsSpecified,
      videoCount,
      videosWithSchema,
      issues,
    };
  }
}
