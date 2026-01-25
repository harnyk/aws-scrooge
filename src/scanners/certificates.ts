import { ACMClient, ListCertificatesCommand, DescribeCertificateCommand } from '@aws-sdk/client-acm';
import type { ScanResult, ACMCertificate } from '../types.js';

export async function scanACMCertificates(): Promise<ScanResult<ACMCertificate>> {
  const client = new ACMClient({});

  try {
    const certificates: ACMCertificate[] = [];
    let nextToken: string | undefined;

    do {
      const listResponse = await client.send(
        new ListCertificatesCommand({
          NextToken: nextToken,
        })
      );

      for (const certSummary of listResponse.CertificateSummaryList || []) {
        if (certSummary.CertificateArn) {
          const describeResponse = await client.send(
            new DescribeCertificateCommand({
              CertificateArn: certSummary.CertificateArn,
            })
          );

          const cert = describeResponse.Certificate;
          if (cert) {
            certificates.push({
              certificateArn: cert.CertificateArn || 'Unknown',
              domainName: cert.DomainName || 'Unknown',
              status: cert.Status || 'Unknown',
              type: cert.Type || 'Unknown',
            });
          }
        }
      }

      nextToken = listResponse.NextToken;
    } while (nextToken);

    return {
      name: 'ACM Certificates',
      count: certificates.length,
      resources: certificates,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { name: 'ACM Certificates', count: 0, resources: [], error: message };
  }
}
