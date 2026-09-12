'use server';

import connectDB from '@/lib/db';
import { AuditLog } from '@/lib/models/audit';
import { getSession } from '@/lib/auth';

export async function logAuditAction(params: {
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      console.warn('Attempted to log action without a valid session');
      return { success: false, error: 'Unauthorized' };
    }

    const log = new AuditLog({
      action: params.action,
      performedBy: session.userId,
      entity: params.entity,
      entityId: params.entityId,
      metadata: params.metadata,
    });

    await log.save();
    return { success: true };
  } catch (error) {
    console.error('Error logging audit action:', error);
    // Don't throw here to prevent breaking the main transaction flow just because logging failed.
    return { success: false, error: 'Failed to log action' };
  }
}

export async function getAuditLogs(page = 1, limit = 20) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || session.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const skip = (page - 1) * limit;

    const logs = await AuditLog.find()
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await AuditLog.countDocuments();

    // Convert ObjectIds to strings to avoid passing non-serializable objects to client components
    const serializedLogs = logs.map((log: any) => ({
      ...log,
      _id: log._id.toString(),
      performedBy: log.performedBy ? {
        ...log.performedBy,
        _id: log.performedBy._id.toString()
      } : null,
      createdAt: log.createdAt?.toISOString(),
      updatedAt: log.updatedAt?.toISOString()
    }));

    return {
      success: true,
      data: {
        logs: serializedLogs,
        pagination: {
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          page,
          limit
        }
      }
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return { success: false, error: 'Failed to fetch audit logs' };
  }
}
