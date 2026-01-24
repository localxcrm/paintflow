'use client';

import { useMemo } from 'react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, Shield, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Subcontractor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialty: string;
  defaultPayoutPct?: number;
  color?: string;
  isActive: boolean;
  calendarToken?: string;
  userId?: string;
  hasAppAccess?: boolean;
  licenseNumber?: string;
  licenseExpirationDate?: string;
  licenseImageUrl?: string;
  insuranceNumber?: string;
  insuranceExpirationDate?: string;
  insuranceImageUrl?: string;
}

interface ExpiringComplianceListProps {
  subcontractors: Subcontractor[];
}

interface ComplianceIssue {
  subId: string;
  subName: string;
  subColor?: string;
  docType: 'license' | 'insurance';
  expirationDate: Date;
  daysRemaining: number;
  isExpired: boolean;
}

export function ExpiringComplianceList({ subcontractors }: ExpiringComplianceListProps) {
  const issues = useMemo(() => {
    const complianceIssues: ComplianceIssue[] = [];
    const today = new Date();

    subcontractors.forEach((sub) => {
      // Check license expiration
      if (sub.licenseExpirationDate) {
        const expirationDate = new Date(sub.licenseExpirationDate);
        const daysRemaining = differenceInDays(expirationDate, today);

        // Include if expired or expiring within 30 days
        if (daysRemaining <= 30) {
          complianceIssues.push({
            subId: sub.id,
            subName: sub.name,
            subColor: sub.color,
            docType: 'license',
            expirationDate,
            daysRemaining,
            isExpired: daysRemaining < 0,
          });
        }
      }

      // Check insurance expiration
      if (sub.insuranceExpirationDate) {
        const expirationDate = new Date(sub.insuranceExpirationDate);
        const daysRemaining = differenceInDays(expirationDate, today);

        // Include if expired or expiring within 30 days
        if (daysRemaining <= 30) {
          complianceIssues.push({
            subId: sub.id,
            subName: sub.name,
            subColor: sub.color,
            docType: 'insurance',
            expirationDate,
            daysRemaining,
            isExpired: daysRemaining < 0,
          });
        }
      }
    });

    // Sort by urgency: expired first, then by days remaining ascending
    return complianceIssues.sort((a, b) => {
      if (a.isExpired && !b.isExpired) return -1;
      if (!a.isExpired && b.isExpired) return 1;
      return a.daysRemaining - b.daysRemaining;
    });
  }, [subcontractors]);

  const getStatusColor = (issue: ComplianceIssue) => {
    if (issue.isExpired) return 'text-red-600 bg-red-50 border-red-200';
    if (issue.daysRemaining <= 7) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  const getStatusBadge = (issue: ComplianceIssue) => {
    if (issue.isExpired) {
      return (
        <Badge variant="destructive" className="text-xs">
          Expirado
        </Badge>
      );
    }
    if (issue.daysRemaining <= 7) {
      return (
        <Badge className="text-xs bg-orange-500 hover:bg-orange-600">
          {issue.daysRemaining} {issue.daysRemaining === 1 ? 'dia' : 'dias'}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
        {issue.daysRemaining} dias
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          Documentos Expirando
        </CardTitle>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
            <p className="font-semibold text-green-700">Todos documentos em dia</p>
            <p className="text-sm text-slate-500 mt-1">
              Nenhum documento expira nos proximos 30 dias
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map((issue, index) => {
              const Icon = issue.docType === 'license' ? Shield : FileText;
              const docLabel = issue.docType === 'license' ? 'Licenca' : 'Seguro';

              return (
                <div
                  key={`${issue.subId}-${issue.docType}-${index}`}
                  className={cn(
                    'p-3 rounded-lg border transition-colors hover:bg-slate-50 cursor-pointer',
                    getStatusColor(issue)
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm truncate">{issue.subName}</p>
                          {getStatusBadge(issue)}
                        </div>
                        <p className="text-xs text-slate-600">
                          {docLabel} - {format(issue.expirationDate, 'P', { locale: ptBR })}
                        </p>
                        {issue.isExpired && (
                          <p className="text-xs font-semibold text-red-600 mt-1">
                            Expirado ha {Math.abs(issue.daysRemaining)}{' '}
                            {Math.abs(issue.daysRemaining) === 1 ? 'dia' : 'dias'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
