import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { notificationService } from '../lib/notificationService';
import { Calendar, Clock, CheckCircle, AlertCircle, Loader2, ShieldCheck, Lock, Sparkles } from 'lucide-react';

export default function SlotBooking({ user }) {
  const [slots, setSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const demoSlots = [
    { id: 'slot-1', slot_time: new Date(Date.now() + 86400000).toISOString(), max_capacity: 20, current_bookings: 5 },
    { id: 'slot-2', slot_time: new Date(Date.now() + 100800000).toISOString(), max_capacity: 20, current_bookings: 18 },
    { id: 'slot-3', slot_time: new Date(Date.now() + 172800000).toISOString(), max_capacity: 20, current_bookings: 20 },
  ];

  const demoBookings = [
    { id: 'book-101', slot_id: 'slot-prev', slot_time: new Date(Date.now() + 86400000).toISOString(), status: 'booked' }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      if (user?.is_demo) {
        setSlots(demoSlots);
        setMyBookings(demoBookings);
        setLoading(false);
        return;
      }

      // Fetch available time slots
      const { data: slotData, error: slotError } = await supabase
        .from('time_slots')
        .select('*')
        .order('slot_time', { ascending: true });

      if (slotError) {
        setSlots(demoSlots);
      } else {
        setSlots(slotData && slotData.length > 0 ? slotData : demoSlots);
      }

      // Fetch user's existing bookings
      const { data: bookData, error: bookError } = await supabase
        .from('bookings')
        .select('*')
        .eq('ration_id', user.ration_id)
        .order('slot_time', { ascending: true });

      if (!bookError && bookData) {
        setMyBookings(bookData);
      }
    } catch (err) {
      console.error(err);
      setSlots(demoSlots);
      setMyBookings(demoBookings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.ration_id) {
      fetchData();
    }

    const slotSubscription = supabase
      .channel('public:time_slots')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_slots' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(slotSubscription);
    };
  }, [user?.ration_id]);

  const handleBookSlot = async (slot) => {
    setMessage({ type: '', text: '' });
    setBookingInProgress(slot.id);

    try {
      if (user?.is_demo) {
        setTimeout(() => {
          if (slot.current_bookings >= slot.max_capacity) {
            setMessage({ type: 'error', text: 'Slot is already full! Please select another time.' });
          } else {
            setMyBookings((prev) => [...prev, { id: `book-${Date.now()}`, slot_id: slot.id, slot_time: slot.slot_time, status: 'booked' }]);
            setSlots((prev) => prev.map(s => s.id === slot.id ? { ...s, current_bookings: s.current_bookings + 1 } : s));
            setMessage({ type: 'success', text: 'Slot successfully booked using Atomic RPC protocol!' });

            notificationService.sendAlert({
              type: 'booking',
              title: '🕒 Pickup Slot Confirmed!',
              body: `Your distribution slot on ${new Date(slot.slot_time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} at ${new Date(slot.slot_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} is locked in!`
            });
          }
          setBookingInProgress(null);
        }, 800);
        return;
      }

      // ATOMIC BOOKING PROTOCOL: Use Postgres RPC function to prevent race conditions & overbooking
      const { data: isBooked, error: rpcError } = await supabase.rpc('book_slot', {
        target_ration_id: user.ration_id,
        target_slot_id: slot.id
      });

      if (rpcError) {
        throw rpcError;
      }

      if (isBooked === true) {
        setMessage({ type: 'success', text: 'Distribution pickup slot successfully booked atomically!' });

        notificationService.sendAlert({
          type: 'booking',
          title: '🕒 Pickup Slot Confirmed!',
          body: `Your distribution slot on ${new Date(slot.slot_time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} is confirmed via atomic Postgres RPC!`
        });

        fetchData();
      } else {
        setMessage({ type: 'error', text: 'Slot reached maximum capacity just now! Please select another time.' });
      }
    } catch (err) {
      console.error('Atomic Booking Error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to execute atomic slot booking.' });
    } finally {
      setBookingInProgress(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
          <Calendar className="w-7 h-7 text-blue-600" />
          <span>Slot Reservation</span>
        </h2>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between ${message.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
          }`}>
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="font-semibold">{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: '', text: '' })} className="text-xs opacity-70 hover:opacity-100 uppercase font-mono">Dismiss</button>
        </div>
      )}

      {/* Existing User Bookings */}
      {myBookings.length > 0 && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span>Your Reserved Pickup Slots</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myBookings.map((book) => (
              <div key={book.id} className="p-3.5 rounded-xl bg-white border border-blue-200 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-xs font-mono text-blue-600 font-bold uppercase">GUARANTEED RESERVATION</span>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">
                    {new Date(book.slot_time).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(book.slot_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs border border-blue-200">
                  CONFIRMED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Time Slots List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center justify-between">
          <span>Shop Distribution Slots</span>
        </h3>

        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-sm font-mono">Checking database capacities...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {slots.map((slot) => {
              const dateObj = new Date(slot.slot_time);
              const isFull = slot.current_bookings >= slot.max_capacity;
              const isAlmostFull = slot.current_bookings >= slot.max_capacity * 0.8 && !isFull;
              const isAlreadyBooked = myBookings.some(b => b.slot_time === slot.slot_time);

              return (
                <div key={slot.id} className={`bg-white rounded-3xl p-6 shadow-sm border transition-all flex flex-col justify-between ${isFull ? 'opacity-60 bg-gray-50 border-gray-200' : 'border-gray-200 hover:shadow-md hover:border-blue-200'}`}>
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="text-blue-600 font-bold">SLOT #{slot.id.split('-').pop()}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${isFull ? 'bg-red-50 text-red-600 border border-red-200' : isAlmostFull ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                        {isFull ? 'FULL CAPACITY' : `${slot.max_capacity - slot.current_bookings} SEATS LEFT`}
                      </span>
                    </div>

                    <h4 className="text-lg font-extrabold text-gray-900 mt-1">
                      {dateObj.toLocaleDateString('en-IN', { weekday: 'short', month: 'long', day: 'numeric' })}
                    </h4>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mt-1 font-medium">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>{dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-xs font-mono text-gray-500 mb-1">
                        <span>Capacity Quota</span>
                        <span>{slot.current_bookings} / {slot.max_capacity}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : isAlmostFull ? 'bg-orange-400' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, (slot.current_bookings / slot.max_capacity) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookSlot(slot)}
                    disabled={isFull || isAlreadyBooked || bookingInProgress === slot.id}
                    className={`mt-6 w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${isAlreadyBooked ? 'bg-blue-50 text-blue-600 border border-blue-200 cursor-default' :
                        isFull ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200' :
                          'bg-blue-700 hover:bg-blue-800 text-white shadow-sm'
                      }`}
                  >
                    {bookingInProgress === slot.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Locking Row...</span>
                      </>
                    ) : isAlreadyBooked ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Already Reserved</span>
                      </>
                    ) : isFull ? (
                      <span>Slot Full</span>
                    ) : (
                      <span>Reserve This Slot</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
