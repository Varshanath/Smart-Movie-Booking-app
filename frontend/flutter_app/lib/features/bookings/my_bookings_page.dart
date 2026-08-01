import 'package:flutter/material.dart';

import '../../shared/theme/app_theme.dart';
import '../movies/models.dart';
import '../movies/movie_booking_api.dart';

class MyBookingsPage extends StatefulWidget {
  const MyBookingsPage({required this.userId, required this.api, super.key});

  final String userId;
  final MovieBookingApi api;

  @override
  State<MyBookingsPage> createState() => _MyBookingsPageState();
}

class _MyBookingsPageState extends State<MyBookingsPage> {
  var _loading = true;
  String? _error;
  var _tickets = <_Ticket>[];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        widget.api.getBookings(),
        widget.api.getShows(),
        widget.api.getMovies(),
        widget.api.getScreens(),
        widget.api.getTheatres(),
        widget.api.getPayments(),
      ]);
      if (!mounted) return;

      final bookings = (results[0] as List<BookingRecord>)
          .where((booking) => booking.userId == widget.userId)
          .toList()
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
      final shows = {for (final show in results[1] as List<Show>) show.id: show};
      final movies = {for (final movie in results[2] as List<Movie>) movie.id: movie};
      final screens = {for (final screen in results[3] as List<Screen>) screen.id: screen};
      final theatres = {
        for (final theatre in results[4] as List<Theatre>) theatre.id: theatre,
      };
      final payments = {
        for (final payment in results[5] as List<PaymentRecord>) payment.id: payment,
      };

      setState(() {
        _tickets = bookings.map((booking) {
          final show = shows[booking.showId];
          final movie = show == null ? null : movies[show.movieId];
          final screen = show == null ? null : screens[show.screenId];
          final theatre = screen == null ? null : theatres[screen.theatreId];
          final payment = payments[booking.paymentId];
          return _Ticket(
            booking: booking,
            movieTitle: movie?.title ?? 'Movie',
            theatreName: theatre?.name ?? 'Theatre',
            screenName: screen?.name ?? 'Screen',
            showTime: show?.startTime,
            amount: payment?.amount,
          );
        }).toList();
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error is MovieBookingApiException
            ? error.message
            : 'Unable to load your bookings right now.';
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Bookings'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh),
            onPressed: _loading ? null : _load,
          ),
        ],
      ),
      body: SafeArea(child: _body()),
    );
  }

  Widget _body() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline,
                  size: 48, color: Theme.of(context).colorScheme.error),
              const SizedBox(height: 12),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                icon: const Icon(Icons.refresh),
                label: const Text('Try again'),
                onPressed: _load,
              ),
            ],
          ),
        ),
      );
    }

    if (_tickets.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.confirmation_number_outlined,
                  size: 48, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 12),
              const Text(
                "You haven't booked any tickets yet.",
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                icon: const Icon(Icons.movie_outlined),
                label: const Text('Browse movies'),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _tickets.length,
        itemBuilder: (context, index) => _ticketCard(_tickets[index]),
      ),
    );
  }

  Widget _ticketCard(_Ticket ticket) {
    final cancelled = ticket.booking.status == 'cancelled';
    const cancelledColor = Color(0xFFEF4444);
    const cancelledBg = Color(0xFF2A1414);
    const confirmedBg = Color(0xFF1A3829);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        border: Border.all(color: AppTheme.border),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    ticket.movieTitle,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: cancelled ? cancelledBg : confirmedBg,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    cancelled ? 'Cancelled' : 'Confirmed',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: cancelled ? cancelledColor : AppTheme.success,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text('${ticket.theatreName} - ${ticket.screenName}'),
            if (ticket.showTime != null)
              Text(_formatDateTime(ticket.showTime!)),
            const SizedBox(height: 6),
            Text('Seats: ${ticket.booking.seatNumbers.join(', ')}'),
            if (ticket.amount != null)
              Text(
                'Amount paid: Rs. ${ticket.amount}',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            const SizedBox(height: 4),
            Text(
              'Booking ID: ${ticket.booking.id.substring(0, 8)}',
              style: const TextStyle(fontSize: 11, color: AppTheme.mutedText),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    final hour = dateTime.hour % 12 == 0 ? 12 : dateTime.hour % 12;
    final minute = dateTime.minute.toString().padLeft(2, '0');
    final period = dateTime.hour >= 12 ? 'PM' : 'AM';
    return '${dateTime.day} ${months[dateTime.month - 1]}, $hour:$minute $period';
  }
}

class _Ticket {
  _Ticket({
    required this.booking,
    required this.movieTitle,
    required this.theatreName,
    required this.screenName,
    required this.showTime,
    required this.amount,
  });

  final BookingRecord booking;
  final String movieTitle;
  final String theatreName;
  final String screenName;
  final DateTime? showTime;
  final int? amount;
}
