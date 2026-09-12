'use server';

import dbConnect from '@/lib/db';
import { AuditLog } from '@/lib/models/audit';
import { getSession } from '@/lib/auth';

export async function getAuditLogs() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: Super Admin required');
    }

    await dbConnect();
    const logs = await AuditLog.find()
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    return { success: true, data: JSON.parse(JSON.stringify(logs)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
