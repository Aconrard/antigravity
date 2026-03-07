import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTHORIZED_INSTRUCTORS } from '../auth/route';

export async function GET(request: Request) {
    const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY || '';
    const FORM_ID = process.env.JOTFORM_FORM_ID || '';
    const BASE_URL = `https://api.jotform.com/form/${FORM_ID}/submissions`;

    const cookieStore = await cookies();
    const session = cookieStore.get('SMC_Auth_Session');

    if (!session || !session.value || !(session.value in AUTHORIZED_INSTRUCTORS)) {
        return NextResponse.json(
            { error: 'Unauthorized: Missing or invalid session cookie' },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '750';
    const offset = searchParams.get('offset') || '0';
    const orderby = searchParams.get('orderby') || 'created_at';

    if (!JOTFORM_API_KEY || !FORM_ID) {
        return NextResponse.json(
            { error: 'Server configuration error: Missing JotForm credentials' },
            { status: 500 }
        );
    }

    const url = `${BASE_URL}?apiKey=${JOTFORM_API_KEY}&limit=${limit}&offset=${offset}&orderby=${orderby}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            return NextResponse.json(
                { error: `JotForm API HTTP error: ${response.status} ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch from JotForm:', error);
        return NextResponse.json(
            { error: 'Internal Server Error while communicating with JotForm API' },
            { status: 500 }
        );
    }
}
