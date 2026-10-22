import { getDb, admin } from "./firebaseAdmin.js";

// Qualquer pergunta ou oráculo custa 5 créditos.
export function calculateConsultationCost(
  _message: string,
  _oracleType?: string
): number {
  return 5;
}

export interface DebitResult {
  success: boolean;
  transactionId?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  error?: string;
}

export async function debitCredits(params: {
  uid: string;
  amount: number;
  reason: string;
  idempotencyKey: string;
  consultationId?: string;
}): Promise<DebitResult> {
  const { uid, amount, reason, idempotencyKey, consultationId } = params;

  if (amount <= 0) {
    return { success: true, balanceBefore: 0, balanceAfter: 0 };
  }

  const db = getDb();
  const userRef = db.collection("users").doc(uid);
  const logRef = userRef.collection("credit_logs").doc(idempotencyKey);

  try {
    const result = await db.runTransaction(async (t) => {
      // Check for idempotency
      const existingLog = await t.get(logRef);
      if (existingLog.exists) {
        const data = existingLog.data();
        return {
          success: true,
          transactionId: idempotencyKey,
          balanceBefore: data?.balanceBefore,
          balanceAfter: data?.balanceAfter,
        };
      }

      const userDoc = await t.get(userRef);
      if (!userDoc.exists) {
        throw new Error("Usuário não encontrado.");
      }

      const currentCredits = Number(userDoc.data()?.credits || 0);
      if (currentCredits < amount) {
        throw new Error("Créditos insuficientes.");
      }

      const newBalance = currentCredits - amount;

      t.update(userRef, {
        credits: newBalance,
        lastCreditUseAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // P0-23: Save with status debited
      t.set(logRef, {
        transactionId: idempotencyKey,
        uid,
        type: "consultation_debit",
        amount,
        balanceBefore: currentCredits,
        balanceAfter: newBalance,
        reason,
        status: "debited",
        consultationId: consultationId || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        transactionId: idempotencyKey,
        balanceBefore: currentCredits,
        balanceAfter: newBalance,
      };
    });

    return result;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Falha ao debitar créditos.",
    };
  }
}

export async function markDebitCompleted(uid: string, idempotencyKey: string): Promise<void> {
  try {
    const db = getDb();
    const logRef = db
      .collection("users")
      .doc(uid)
      .collection("credit_logs")
      .doc(idempotencyKey);
    await logRef.update({
      status: "completed",
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.warn("[LEDGER_MARK_COMPLETED_WARN]", e);
  }
}

export async function refundCredits(params: {
  uid: string;
  amount: number;
  reason: string;
  originalTransactionId: string;
}): Promise<boolean> {
  const { uid, amount, reason, originalTransactionId } = params;
  if (amount <= 0) return true;

  const db = getDb();
  const userRef = db.collection("users").doc(uid);
  const refundId = `refund_${originalTransactionId}`;
  const logRef = userRef.collection("credit_logs").doc(refundId);

  try {
    await db.runTransaction(async (t) => {
      const existingRefund = await t.get(logRef);
      if (existingRefund.exists) {
        return; // Idempotent refund
      }

      const userDoc = await t.get(userRef);
      const currentCredits = userDoc.exists ? Number(userDoc.data()?.credits || 0) : 0;
      const newBalance = currentCredits + amount;

      t.set(
        userRef,
        {
          credits: newBalance,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      t.set(logRef, {
        transactionId: refundId,
        originalTransactionId,
        uid,
        type: "refund",
        amount,
        balanceBefore: currentCredits,
        balanceAfter: newBalance,
        reason,
        status: "refunded",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return true;
  } catch (err) {
    console.error("[REFUND_ERROR]", err);
    // P0-23: If refund fails, log refund_pending so reconciliation job can recover it
    try {
      await logRef.set(
        {
          transactionId: refundId,
          originalTransactionId,
          uid,
          type: "refund",
          amount,
          reason,
          status: "refund_pending",
          error: String(err),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error("[CRITICAL_REFUND_PENDING_WRITE_FAILED]", e);
    }
    return false;
  }
}
