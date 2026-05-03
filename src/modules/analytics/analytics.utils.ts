import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  getDaysInMonth,
  parseISO,
} from 'date-fns';

export type FilterBy = 'week' | 'month' | 'year' | undefined;

export const getDateRange = (filterBy: FilterBy = 'week') => {
  const now = new Date();

  switch (filterBy) {
    case 'week':
      return {
        gte: startOfWeek(now, { weekStartsOn: 1 }), // Monday
        lte: endOfWeek(now, { weekStartsOn: 1 }),
      };

    case 'month':
      return {
        gte: startOfMonth(now),
        lte: endOfMonth(now),
      };

    case 'year':
      return {
        gte: startOfYear(now),
        lte: endOfYear(now),
      };

    default:
      return {
        gte: startOfWeek(now),
        lte: endOfWeek(now),
      };
  }
};

type Payment = { amount: number };
type Subscription = { payments: Payment[] };
type Advisor = { createdAt: Date | string; subscriptions: Subscription[] };

type Aggregated = { label: string; value: { created: number; income: number } };

export const aggregateAdvisors = (Advisors: Advisor[], filterBy: FilterBy): Aggregated[] => {
  const map = new Map<string, { created: number; income: number }>();

  Advisors.forEach((Advisor) => {
    const date =
      Advisor.createdAt instanceof Date ? Advisor.createdAt : parseISO(Advisor.createdAt);
    let label: string;

    if (filterBy === 'month')
      label = format(date, 'd'); // Jan–Dec
    else if (filterBy === 'year') label = format(date, 'MMM');
    // 1–31
    else label = format(date, 'EEE'); // Mon, Tue...

    if (!map.has(label)) map.set(label, { created: 0, income: 0 });

    const val = map.get(label)!;
    val.created += 1;

    const totalIncome = Advisor.subscriptions
      .flatMap((s) => s.payments)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    val.income += totalIncome;
  });

  const now = new Date();
  const order =
    filterBy === 'year'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : filterBy === 'month'
        ? Array.from({ length: getDaysInMonth(now) }, (_, i) => String(i + 1))
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // default to week

  return order.map((label) => ({
    label,
    value: map.get(label) || { created: 0, income: 0 },
  }));
};

type BookingStatus = 'PENDING' | 'CANCELLED' | 'SCHEDULED' | 'COMPLETED';
type Booking = { createdAt: Date; status: BookingStatus };

export const aggregateBookings = (
  Advisor: { id: string; bookings: Booking[] },
  filterBy: FilterBy = 'week',
) => {
  const bookingMap = new Map<string, number>();
  const cancelMap = new Map<string, number>();

  Advisor.bookings.forEach((b) => {
    const date = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
    let label: string;

    if (filterBy === 'month')
      label = format(date, 'd'); // 1–31
    else if (filterBy === 'year')
      label = format(date, 'MMM'); // Jan–Dec
    else label = format(date, 'EEE'); // Mon–Sun (default week)

    const targetMap = b.status === 'CANCELLED' ? cancelMap : bookingMap;
    targetMap.set(label, (targetMap.get(label) || 0) + 1);
  });
  const now = new Date();
  const order =
    filterBy === 'year'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : filterBy === 'month'
        ? Array.from({ length: getDaysInMonth(now) }, (_, i) => String(i + 1))
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // default week

  const bookings = order.map((label) => ({
    label,
    value: bookingMap.get(label) || 0,
  }));

  const cancellations = order.map((label) => ({
    label,
    value: cancelMap.get(label) || 0,
  }));

  return { bookings, cancellations };
};
