/** @jest-environment node */

// Set environment variables before module scope execution
process.env.JOTFORM_API_KEY = 'test_key';
process.env.JOTFORM_FORM_ID = 'test_form';

import { POST, DELETE, AUTHORIZED_INSTRUCTORS } from '../app/api/auth/route';
import { GET } from '../app/api/submissions/route';
import { cookies } from 'next/headers';

// Mock next/headers cookies
jest.mock('next/headers', () => ({
    cookies: jest.fn()
}));

// Mock global fetch
global.fetch = jest.fn();

describe('API Route Handlers', () => {
    let mockCookieStore: {
        get: jest.Mock;
        set: jest.Mock;
        delete: jest.Mock;
    };

    beforeEach(() => {
        mockCookieStore = {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn()
        };
        (cookies as jest.Mock).mockResolvedValue(mockCookieStore);
        (global.fetch as jest.Mock).mockClear();
    });

    describe('Auth API (POST /api/auth)', () => {
        it('should reject requests with missing credentials', async () => {
            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ universalId: 'krummel' }) // missing employeeNum
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.success).toBe(false);
        });

        it('should reject invalid credentials', async () => {
            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ universalId: 'invalid_user', employeeNum: '000' })
            });
            const res = await POST(req);
            expect(res.status).toBe(401);
        });

        it('should reject length mismatches (timing-attack prevention check)', async () => {
            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ universalId: 'krummel', employeeNum: '10' }) // Too short
            });
            const res = await POST(req);
            expect(res.status).toBe(401);
        });

        it('should accept valid credentials and set a cookie', async () => {
            const req = new Request('http://localhost', {
                method: 'POST',
                body: JSON.stringify({ universalId: 'krummel', employeeNum: AUTHORIZED_INSTRUCTORS['krummel'] })
            });
            const res = await POST(req);
            expect(res.status).toBe(200);

            const data = await res.json();
            expect(data.success).toBe(true);
            expect(data.instructorId).toBe('krummel');
            expect(mockCookieStore.set).toHaveBeenCalledWith(
                'SMC_Auth_Session',
                'krummel',
                expect.any(Object)
            );
        });
    });

    describe('Auth API (DELETE /api/auth)', () => {
        it('should reject deletion if no session cookie exists', async () => {
            mockCookieStore.get.mockReturnValue(undefined);
            const res = await DELETE();
            expect(res.status).toBe(401);
            expect(mockCookieStore.delete).not.toHaveBeenCalled();
        });

        it('should delete cookie if valid session exists', async () => {
            mockCookieStore.get.mockReturnValue({ value: 'krummel' });
            const res = await DELETE();
            expect(res.status).toBe(200);
            expect(mockCookieStore.delete).toHaveBeenCalledWith('SMC_Auth_Session');
        });
    });

    describe('Submissions API (GET /api/submissions)', () => {
        it('should reject requests with no session cookie', async () => {
            mockCookieStore.get.mockReturnValue(undefined);
            const req = new Request('http://localhost/api/submissions');
            const res = await GET(req);
            expect(res.status).toBe(401);
            const data = await res.json();
            expect(data.error).toMatch(/Missing or invalid session cookie/);
        });

        it('should reject requests with an invalid instructor ID in cookie', async () => {
            mockCookieStore.get.mockReturnValue({ value: 'hacker123' });
            const req = new Request('http://localhost/api/submissions');
            const res = await GET(req);
            expect(res.status).toBe(401);
            const data = await res.json();
            expect(data.error).toMatch(/Missing or invalid session cookie/);
        });

        it('should proxy request to JotForm if authenticated', async () => {
            mockCookieStore.get.mockReturnValue({ value: 'krummel' });
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({ responseCode: 200, content: [{ id: '1' }] })
            });

            // Environment variables are set at the top of the file before imports now
            const req = new Request('http://localhost/api/submissions?limit=10&offset=0');
            const res = await GET(req);

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.content[0].id).toBe('1');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('api.jotform.com')
            );
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('apiKey=test_key')
            );
        });
    });
});
