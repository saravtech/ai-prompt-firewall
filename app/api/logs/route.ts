import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-client';
import { verifyAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Auth check - simplified to avoid build-time issues
  const isAuthenticated = await verifyAdminAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const hasPII = searchParams.get('hasPII');
    const hasInjection = searchParams.get('hasInjection');
    const blocked = searchParams.get('blocked');
    const riskType = searchParams.get('riskType');
    const decision = searchParams.get('decision');
    const format = searchParams.get('format');

    const where: any = {};
    
    if (hasPII === 'true') where.hasPII = true;
    else if (hasPII === 'false') where.hasPII = false;
    
    if (hasInjection === 'true') where.hasInjection = true;
    else if (hasInjection === 'false') where.hasInjection = false;
    
    if (blocked === 'true') where.blocked = true;
    else if (blocked === 'false') where.blocked = false;

    let logs, total;
    try {
      const whereClause = Object.keys(where).length > 0 ? where : {};
      [logs, total] = await Promise.all([
        prisma.log.findMany({
          where: whereClause,
          orderBy: { timestamp: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.log.count({ 
          where: whereClause
        }),
      ]);
    } catch (dbError: any) {
      if (dbError.code === 'P2001' || dbError.code === 'P2021' || dbError.message?.includes('does not exist') || dbError.message?.includes('no such table')) {
        // Return empty array if table doesn't exist
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            limit,
            offset,
            hasMore: false,
          },
        });
      }
      throw dbError;
    }

    // Parse and filter by risk type and decision from metadata
    let filteredLogs = logs.map((log: any) => {
      const metadata = log.metadata ? JSON.parse(log.metadata) : null;
      const risks = metadata?.risks || [];
      const decisionFromMeta = metadata?.decision || (log.blocked ? 'block' : 'allow');

      return {
        ...log,
        piiTypes: log.piiTypes ? JSON.parse(log.piiTypes) : [],
        metadata,
        risks,
        decision: decisionFromMeta,
      };
    });

    // Filter by risk type if provided
    if (riskType) {
      filteredLogs = filteredLogs.filter((log: any) => {
        return log.risks?.some((risk: any) => risk.type === riskType);
      });
    }

    // Filter by decision if provided
    if (decision) {
      filteredLogs = filteredLogs.filter((log: any) => log.decision === decision);
    }

    // Recalculate total after filtering
    const filteredTotal = riskType || decision ? filteredLogs.length : total;

    // Export functionality
    if (format === 'csv') {
      const csvHeaders = ['ID', 'Timestamp', 'Prompt', 'Response', 'Decision', 'Blocked', 'Has PII', 'Has Injection', 'Risk Score', 'PII Types'];
      const csvRows = filteredLogs.map((log: any) => [
        log.id,
        log.timestamp,
        `"${log.prompt.replace(/"/g, '""')}"`,
        log.response ? `"${log.response.replace(/"/g, '""')}"` : '',
        log.decision || (log.blocked ? 'block' : 'allow'),
        log.blocked ? 'Yes' : 'No',
        log.hasPII ? 'Yes' : 'No',
        log.hasInjection ? 'Yes' : 'No',
        log.riskScore,
        log.piiTypes.join('; '),
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map((row: any) => row.join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="firewall-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(filteredLogs, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="firewall-logs-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredLogs,
      pagination: {
        total: filteredTotal,
        limit,
        offset,
        hasMore: offset + limit < filteredTotal,
      },
    });
  } catch (error) {
    console.error('Logs GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
        data: [] // Return empty array to prevent UI breakage
      },
      { status: 500 }
    );
  }
}
