import 'package:flutter/material.dart';

import '../bookings/my_bookings_page.dart';
import '../movies/models.dart';
import '../movies/movie_booking_api.dart';

const _maxSeatsPerBooking = 10;

class SeatSelectionPage extends StatefulWidget {
  const SeatSelectionPage({
    required this.movie,
    required this.show,
    required this.theatreName,
    required this.screenName,
    required this.userId,
    required this.email,
    required this.api,
    super.key,
  });

  final Movie movie;
  final Show show;
  final String theatreName;
  final String screenName;
  final String userId;
  final String email;
  final MovieBookingApi api;

  @override
  State<SeatSelectionPage> createState() => _SeatSelectionPageState();
}

class _SeatSelectionPageState extends State<SeatSelectionPage> {
  var _loading = true;
  var _submitting = false;
  String? _error;
  SeatMap? _seatMap;
  final _selectedSeats = <String>{};

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
      final seatMap = await widget.api.getShowSeatMap(widget.show.id);
      if (!mounted) return;
      setState(() {
        _seatMap = seatMap;
        _selectedSeats.removeWhere((seat) => seatMap.bookedSeats.contains(seat));
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error is MovieBookingApiException
            ? error.message
            : 'Unable to load seats right now.';
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      appBar: AppBar(
        title: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.movie.title),
            Text(
              '${widget.theatreName} - ${widget.screenName}',
              style: const TextStyle(fontSize: 12, color: Colors.white70),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(child: _body()),
            if (_seatMap != null) _bottomBar(),
          ],
        ),
      ),
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

    final seatMap = _seatMap!;
    return Column(
      children: [
        const SizedBox(height: 12),
        _screenIndicator(),
        const SizedBox(height: 20),
        Expanded(
          child: SingleChildScrollView(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  for (var row = 0; row < seatMap.rows; row += 1)
                    _seatRow(seatMap, row),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        _legend(),
        const SizedBox(height: 12),
      ],
    );
  }

  Widget _screenIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        children: [
          Container(
            height: 8,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(4),
              gradient: LinearGradient(
                colors: [
                  Colors.grey.shade300,
                  Colors.grey.shade500,
                  Colors.grey.shade300,
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withValues(alpha: 0.5),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'All eyes this way',
            style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
          ),
        ],
      ),
    );
  }

  Widget _seatRow(SeatMap seatMap, int row) {
    final rowLetter = String.fromCharCode(65 + row);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 20,
            child: Text(
              rowLetter,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(width: 6),
          for (var seat = 1; seat <= seatMap.seatsPerRow; seat += 1)
            _seatButton(seatMap, '$rowLetter$seat'),
        ],
      ),
    );
  }

  Widget _seatButton(SeatMap seatMap, String label) {
    final booked = seatMap.bookedSeats.contains(label);
    final selected = _selectedSeats.contains(label);

    Color color;
    Color iconColor;
    if (booked) {
      color = Colors.grey.shade300;
      iconColor = Colors.grey.shade500;
    } else if (selected) {
      color = Theme.of(context).colorScheme.primary;
      iconColor = Colors.white;
    } else {
      color = Colors.white;
      iconColor = Theme.of(context).colorScheme.primary;
    }

    return Padding(
      padding: const EdgeInsets.all(2),
      child: InkWell(
        borderRadius: BorderRadius.circular(6),
        onTap: booked ? null : () => _toggleSeat(label),
        child: Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: selected
                  ? Theme.of(context).colorScheme.primary
                  : const Color(0xFFE4DDD7),
            ),
          ),
          child: Icon(Icons.event_seat, size: 16, color: iconColor),
        ),
      ),
    );
  }

  void _toggleSeat(String label) {
    setState(() {
      if (_selectedSeats.contains(label)) {
        _selectedSeats.remove(label);
        return;
      }
      if (_selectedSeats.length >= _maxSeatsPerBooking) {
        _showMessage('You can select up to $_maxSeatsPerBooking seats.');
        return;
      }
      _selectedSeats.add(label);
    });
  }

  Widget _legend() {
    return Wrap(
      spacing: 16,
      alignment: WrapAlignment.center,
      children: [
        _legendItem(Colors.white, 'Available'),
        _legendItem(Theme.of(context).colorScheme.primary, 'Selected'),
        _legendItem(Colors.grey.shade300, 'Booked'),
      ],
    );
  }

  Widget _legendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: const Color(0xFFE4DDD7)),
          ),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }

  Widget _bottomBar() {
    final total = _selectedSeats.length * _seatMap!.price;
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _selectedSeats.isEmpty
                        ? 'Select seats'
                        : '${_selectedSeats.length} seat${_selectedSeats.length == 1 ? '' : 's'}',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  if (_selectedSeats.isNotEmpty)
                    Text(
                      'Rs. $total',
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                ],
              ),
            ),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(minimumSize: const Size(0, 48)),
              icon: const Icon(Icons.confirmation_number_outlined),
              label: Text(_submitting ? 'Booking...' : 'Pay & Book'),
              onPressed: _selectedSeats.isEmpty || _submitting
                  ? null
                  : _confirmAndBook,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmAndBook() async {
    if (widget.userId.isEmpty) {
      _showMessage('Login response did not include a user id.');
      return;
    }

    final total = _selectedSeats.length * _seatMap!.price;
    final seats = _selectedSeats.toList()..sort();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Confirm booking'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.movie.title,
                style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('${widget.theatreName} - ${widget.screenName}'),
            Text(TimeOfDay.fromDateTime(widget.show.startTime)
                .format(dialogContext)),
            const SizedBox(height: 12),
            Text('Seats: ${seats.join(', ')}'),
            const SizedBox(height: 4),
            Text('Total: Rs. $total',
                style: const TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(minimumSize: const Size(0, 44)),
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Confirm & Pay'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _submitting = true);
    try {
      final payment = await widget.api.createPayment(
        amount: total,
        status: 'paid',
        providerReference: 'txn_${DateTime.now().millisecondsSinceEpoch}',
      );

      final booking = await widget.api.createBooking(
        userId: widget.userId,
        showId: widget.show.id,
        paymentId: payment.id,
        seatNumbers: seats,
      );

      if (!mounted) return;
      await _showSuccess(booking, seats, total);
    } catch (error) {
      if (!mounted) return;
      _showMessage(
        error is MovieBookingApiException
            ? error.message
            : 'Unable to complete booking right now.',
      );
      await _load();
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _showSuccess(
    BookingRecord booking,
    List<String> seats,
    int total,
  ) {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green),
            SizedBox(width: 8),
            Text('Booking confirmed'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.movie.title,
                style: const TextStyle(fontWeight: FontWeight.w700)),
            Text('${widget.theatreName} - ${widget.screenName}'),
            const SizedBox(height: 8),
            Text('Seats: ${seats.join(', ')}'),
            Text('Amount paid: Rs. $total'),
            const SizedBox(height: 8),
            Text(
              'Booking ID: ${booking.id.substring(0, 8)}',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('Done'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(minimumSize: const Size(0, 44)),
            onPressed: () {
              Navigator.pop(dialogContext);
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (_) => MyBookingsPage(
                    userId: widget.userId,
                    api: widget.api,
                  ),
                ),
              );
            },
            child: const Text('View my bookings'),
          ),
        ],
      ),
    );
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}
