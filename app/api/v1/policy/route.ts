import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-client';
import { verifyAdminAuth } from '@/lib/auth';
import { z } from 'zod';
import type { FirewallRule } from '@/lib/firewall';

const policySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  rules: z.array(z.any()).default([]),
});

const updatePolicySchema = policySchema.partial().extend({
  id: z.string(),
});

// GET - List all policies (requires auth)
export async function GET(request: NextRequest) {
  const isAuthenticated = await verifyAdminAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const policies = await prisma.policy.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: policies.map((p) => ({
        ...p,
        rules: JSON.parse(p.rules) as FirewallRule[],
      })),
    });
  } catch (error) {
    console.error('Policy GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new policy (requires auth)
export async function POST(request: NextRequest) {
  const isAuthenticated = await verifyAdminAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, description, enabled, rules } = policySchema.parse(body);

    const validatedRules = rules as FirewallRule[];
    if (!Array.isArray(validatedRules)) {
      return NextResponse.json(
        { success: false, error: 'Rules must be an array' },
        { status: 400 }
      );
    }

    const policy = await prisma.policy.create({
      data: {
        name,
        description,
        enabled,
        rules: JSON.stringify(validatedRules),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...policy,
        rules: JSON.parse(policy.rules) as FirewallRule[],
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Policy POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a policy (requires auth)
export async function PUT(request: NextRequest) {
  const isAuthenticated = await verifyAdminAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = updatePolicySchema.parse(body);

    const updatePayload: any = {};
    if (updateData.name !== undefined) updatePayload.name = updateData.name;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.enabled !== undefined) updatePayload.enabled = updateData.enabled;
    if (updateData.rules !== undefined) {
      const validatedRules = updateData.rules as FirewallRule[];
      if (!Array.isArray(validatedRules)) {
        return NextResponse.json(
          { success: false, error: 'Rules must be an array' },
          { status: 400 }
        );
      }
      updatePayload.rules = JSON.stringify(validatedRules);
    }

    const policy = await prisma.policy.update({
      where: { id },
      data: updatePayload,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...policy,
        rules: JSON.parse(policy.rules) as FirewallRule[],
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Policy PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a policy (requires auth)
export async function DELETE(request: NextRequest) {
  const isAuthenticated = await verifyAdminAuth(request);
  if (!isAuthenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Policy ID is required' },
        { status: 400 }
      );
    }

    await prisma.policy.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Policy DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
