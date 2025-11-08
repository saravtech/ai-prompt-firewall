import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-client';
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

// GET - List all policies
export async function GET(request: NextRequest) {
  try {
    let policies;
    try {
      policies = await prisma.policy.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbError: any) {
      // Check if it's a table doesn't exist error
      if (dbError.code === 'P2001' || dbError.message?.includes('does not exist') || dbError.code === 'P2021') {
        console.error('Database table does not exist. Please run: npm run db:push');
        // Return empty array so UI doesn't break
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
      // Log the actual error for debugging
      console.error('Database error:', dbError);
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      data: policies.map((p) => {
        try {
          return {
            ...p,
            rules: JSON.parse(p.rules) as FirewallRule[],
          };
        } catch (parseError) {
          console.error('Error parsing rules for policy:', p.id, parseError);
          return {
            ...p,
            rules: [],
          };
        }
      }),
    });
  } catch (error) {
    console.error('Policy GET error:', error);
    // Return success with empty array instead of error to prevent UI breakage
    return NextResponse.json({
      success: true,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// POST - Create a new policy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, enabled, rules } = policySchema.parse(body);

    // Validate rules format
    const validatedRules = rules as FirewallRule[];
    if (!Array.isArray(validatedRules)) {
      return NextResponse.json(
        { success: false, error: 'Rules must be an array' },
        { status: 400 }
      );
    }

    let policy;
    try {
      policy = await prisma.policy.create({
        data: {
          name,
          description: description || null,
          enabled,
          rules: JSON.stringify(validatedRules),
        },
      });
    } catch (dbError: any) {
      // Check if it's a table doesn't exist error
      if (dbError.code === 'P2001' || dbError.code === 'P2021' || dbError.message?.includes('does not exist') || dbError.message?.includes('no such table')) {
        console.error('Database table does not exist. Error:', dbError);
        console.error('Please run: npm run db:push');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Database not initialized. Please run: npm run db:push',
            details: dbError.message || String(dbError),
            code: dbError.code
          },
          { status: 500 }
        );
      }
      // Log other database errors for debugging
      console.error('Database error creating policy:', dbError);
      throw dbError;
    }

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
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// PUT - Update a policy
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = updatePolicySchema.parse(body);

    const updatePayload: any = {};
    if (updateData.name !== undefined) updatePayload.name = updateData.name;
    if (updateData.description !== undefined) updatePayload.description = updateData.description;
    if (updateData.enabled !== undefined) updatePayload.enabled = updateData.enabled;
    if (updateData.rules !== undefined) {
      // Validate rules format
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

// DELETE - Delete a policy
export async function DELETE(request: NextRequest) {
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
