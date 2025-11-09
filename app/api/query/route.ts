import { NextRequest, NextResponse } from 'next/server';
import { evaluatePrompt, type FirewallRule } from '@/lib/firewall';
import { prisma } from '@/lib/prisma-client';
import { z } from 'zod';

const querySchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = querySchema.parse(body);

    // Get active policies from database (handle case where tables don't exist yet)
    let firewallRules: FirewallRule[] = [];
    try {
      // Check if prisma is available and has the policy model
      if (prisma && prisma.policy) {
        const activePolicies = await prisma.policy.findMany({
          where: { enabled: true },
        });

        // Convert policies to FirewallRule format
        firewallRules = activePolicies.flatMap((policy: any) => {
          try {
            const rules = JSON.parse(policy.rules);
            return Array.isArray(rules) ? rules : [];
          } catch {
            return [];
          }
        });
      }
    } catch (error: any) {
      // If database tables don't exist yet, use empty rules (firewall will use defaults)
      // Check for specific Prisma errors
      if (error.code === 'P2001' || error.code === 'P2021' || 
          error.message?.includes('does not exist') || 
          error.message?.includes('no such table') ||
          error.message?.includes('Table') && error.message?.includes('does not exist') ||
          error.message?.includes('PrismaClient') ||
          error.message?.includes('not initialized')) {
        console.warn('Database not available, using default firewall rules:', error.message);
      } else {
        console.warn('Could not load policies from database, using default rules:', error);
      }
    }

    // Evaluate the prompt using the firewall
    const evaluation = evaluatePrompt(prompt, null, firewallRules);

    // Determine if blocked based on decision
    const blocked = evaluation.decision === 'block';
    const hasPII = evaluation.risks.some((r) => r.type.startsWith('pii_'));
    const hasInjection = evaluation.risks.some((r) => r.type === 'injection');

    // Extract PII types from risks
    const piiTypes = evaluation.risks
      .filter((r) => r.type.startsWith('pii_'))
      .map((r) => r.type.replace('pii_', ''));

    // Calculate risk score from risks
    const riskScore = evaluation.risks.reduce((score, risk) => {
      const severityScores = { low: 10, medium: 30, high: 60, critical: 100 };
      return Math.max(score, severityScores[risk.severity]);
    }, 0);

    // Generate a mock response (in production, this would call an AI API)
    // Use the modified prompt if it was sanitized
    const promptToUse = evaluation.promptModified !== prompt ? evaluation.promptModified : prompt;
    let response: string | null = null;
    if (!blocked) {
      response = `This is a mock response to: "${promptToUse.substring(0, 50)}${promptToUse.length > 50 ? '...' : ''}"`;
    }

    // Log the query (handle case where tables don't exist yet)
    let logId: string | null = null;
    try {
      // Check if prisma is available and has the log model
      // Also check if it's not a mock client (mock clients have 'no-db' or 'mock' in their behavior)
      if (prisma && prisma.log && typeof prisma.log.create === 'function') {
        console.log('💾 Attempting to save log to database...');
        const log = await prisma.log.create({
          data: {
            prompt: evaluation.promptModified !== prompt ? evaluation.promptModified : prompt,
            response,
            hasPII,
            hasInjection,
            piiTypes: JSON.stringify(piiTypes),
            riskScore,
            blocked,
            metadata: JSON.stringify({
              decision: evaluation.decision,
              originalPrompt: prompt,
              promptModified: evaluation.promptModified !== prompt,
              risks: evaluation.risks,
              explain: evaluation.explain,
              timestamp: new Date().toISOString(),
            }),
          },
        });
        logId = log.id;
        console.log('✅ Log created successfully:', logId);
      } else {
        console.warn('⚠️ Prisma or log model not available');
      }
    } catch (error: any) {
      // If database tables don't exist yet, continue without logging
      // Check for specific Prisma errors
      if (error.code === 'P2001' || error.code === 'P2021' || 
          error.message?.includes('does not exist') || 
          error.message?.includes('no such table') ||
          error.message?.includes('Table') && error.message?.includes('does not exist') ||
          error.message?.includes('PrismaClient') ||
          error.message?.includes('not initialized')) {
        console.warn('⚠️ Database not available, skipping log:', error.message);
      } else {
        console.error('❌ Could not log query to database:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          name: error.name
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: logId || 'no-log',
        decision: evaluation.decision,
        promptModified: evaluation.promptModified,
        response,
        blocked,
        risks: evaluation.risks,
        explain: evaluation.explain,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    console.error('Query API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
