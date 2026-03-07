import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export const AUTHORIZED_INSTRUCTORS: Record<string, string> = {
    krummel: '103293',
    cgerke: '101631',
    aguerne: '102755',
    sorlando: '188217',
    ewaldron: '104588',
    aconrard: '105823'
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { universalId, employeeNum } = body;

        if (!universalId || !employeeNum) {
            return NextResponse.json(
                { success: false, error: 'Missing credentials' },
                { status: 400 }
            );
        }

        const id = universalId.trim().toLowerCase();
        const num = String(employeeNum).trim();
        const expectedNum = AUTHORIZED_INSTRUCTORS[id];

        if (!expectedNum) {
            return NextResponse.json(
                { success: false, error: 'Invalid Universal ID or Employee Number' },
                { status: 401 }
            );
        }

        // Must pad buffers to same length for timingSafeEqual, or check length first
        if (num.length !== expectedNum.length) {
            return NextResponse.json(
                { success: false, error: 'Invalid Universal ID or Employee Number' },
                { status: 401 }
            );
        }

        const isMatch = crypto.timingSafeEqual(
            Buffer.from(num),
            Buffer.from(expectedNum)
        );

        if (isMatch) {
            const cookieStore = await cookies();
            cookieStore.set('SMC_Auth_Session', id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 12 // 12 hours
            });
            return NextResponse.json({ success: true, instructorId: id });
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid Universal ID or Employee Number' },
                { status: 401 }
            );
        }
    } catch {
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    const cookieStore = await cookies();
    const session = cookieStore.get('SMC_Auth_Session');

    if (!session || !session.value) {
        return NextResponse.json(
            { error: 'Unauthorized: No active session to delete' },
            { status: 401 }
        );
    }

    cookieStore.delete('SMC_Auth_Session');
    return NextResponse.json({ success: true });
}
