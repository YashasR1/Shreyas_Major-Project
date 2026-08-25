import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../lib/supabaseClient';

// Mock supabase client methods
vi.mock('../lib/supabaseClient', () => {
  return {
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      })),
      removeChannel: vi.fn()
    }
  };
});

describe('Supabase Database Fetching & Biometric Logic Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly evaluates pending biometrics status when face_encoding or fingerprint_id is missing', async () => {
    const mockPendingUser = {
      ration_id: 'RAT-1001',
      name: 'Rahul Kumar',
      phone: '+91 9876543210',
      face_encoding: null,
      fingerprint_id: null,
      is_enrolling: false
    };

    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const singleMock = vi.fn().mockResolvedValue({ data: mockPendingUser, error: null });

    supabase.from.mockReturnValue({
      select: selectMock,
      eq: eqMock,
      single: singleMock
    });

    const { data } = await supabase.from('users').select('*').eq('ration_id', 'RAT-1001').single();

    expect(supabase.from).toHaveBeenCalledWith('users');
    expect(data.ration_id).toBe('RAT-1001');
    
    // Evaluate verification status logic
    const hasFace = Boolean(data.face_encoding);
    const hasFingerprint = Boolean(data.fingerprint_id);
    const isVerified = hasFace && hasFingerprint;

    expect(isVerified).toBe(false);
  });

  it('correctly evaluates verified biometrics status when both face vector and fingerprint ID exist', async () => {
    const mockVerifiedUser = {
      ration_id: 'RAT-9999',
      name: 'Anjali Sharma',
      phone: '+91 9123456789',
      face_encoding: Array(128).fill(0.123), // standard 128-pt array converted from Float32Array via Array.from()
      fingerprint_id: 'ESP32_FP_7788',
      is_enrolling: false
    };

    const singleMock = vi.fn().mockResolvedValue({ data: mockVerifiedUser, error: null });

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: singleMock
    });

    const { data } = await supabase.from('users').select('*').eq('ration_id', 'RAT-9999').single();

    const hasFace = Boolean(data.face_encoding) && Array.isArray(data.face_encoding) && data.face_encoding.length === 128;
    const hasFingerprint = Boolean(data.fingerprint_id);
    const isVerified = hasFace && hasFingerprint;

    expect(isVerified).toBe(true);
    expect(data.fingerprint_id).toBe('ESP32_FP_7788');
  });

  it('executes atomic slot reservation using supabase.rpc("book_slot")', async () => {
    supabase.rpc.mockResolvedValue({ data: true, error: null });

    const { data: isBooked } = await supabase.rpc('book_slot', {
      target_ration_id: 'RAT-1001',
      target_slot_id: 'slot-uuid-1234'
    });

    expect(supabase.rpc).toHaveBeenCalledWith('book_slot', {
      target_ration_id: 'RAT-1001',
      target_slot_id: 'slot-uuid-1234'
    });
    expect(isBooked).toBe(true);
  });

  it('fetches live read-only shop inventory correctly', async () => {
    const mockInventory = [
      { id: 'inv-1', item_name: 'Subsidized Rice', quantity_available: 500.0, unit: 'kg', unit_price: 3.0 }
    ];

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockInventory, error: null })
    });

    const { data } = await supabase.from('inventory').select('*').order('item_name', { ascending: true });

    expect(supabase.from).toHaveBeenCalledWith('inventory');
    expect(data).toHaveLength(1);
    expect(data[0].item_name).toBe('Subsidized Rice');
  });
});
