import 'package:flutter/material.dart';

import '../../shared/theme/app_theme.dart';
import '../booking/seat_selection_page.dart';
import 'models.dart';
import 'movie_booking_api.dart';

class MovieDetailPage extends StatelessWidget {
  const MovieDetailPage({
    required this.movie,
    required this.shows,
    required this.theatres,
    required this.screens,
    required this.userId,
    required this.email,
    required this.api,
    super.key,
  });

  final Movie movie;
  final List<Show> shows;
  final List<Theatre> theatres;
  final List<Screen> screens;
  final String userId;
  final String email;
  final MovieBookingApi api;

  @override
  Widget build(BuildContext context) {
    final showsByTheatre = <String, List<Show>>{};
    for (final show in shows) {
      final screen = _screenFor(show.screenId);
      if (screen == null) continue;
      showsByTheatre.putIfAbsent(screen.theatreId, () => []).add(show);
    }

    return Scaffold(
      appBar: AppBar(title: Text(movie.title)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _header(context),
            const SizedBox(height: 24),
            Text(
              'Showtimes',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 12),
            if (showsByTheatre.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Text('No showtimes scheduled for this movie yet.'),
              )
            else
              for (final theatreId in showsByTheatre.keys)
                _theatreSection(context, theatreId, showsByTheatre[theatreId]!),
          ],
        ),
      ),
    );
  }

  Widget _header(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 96,
          height: 140,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFFF4D6A), Color(0xFF8C66F2)],
            ),
          ),
          child: const Center(
            child: Icon(Icons.local_movies_outlined,
                size: 40, color: Colors.white70),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                movie.title,
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _chip(Icons.category_outlined, movie.genre),
                  _chip(Icons.language, movie.language),
                  _chip(Icons.timer_outlined, movie.durationLabel),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Released ${movie.releaseDate}',
                style: const TextStyle(color: AppTheme.mutedText),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _chip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        border: Border.all(color: AppTheme.border),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.white),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.white)),
        ],
      ),
    );
  }

  Widget _theatreSection(
    BuildContext context,
    String theatreId,
    List<Show> theatreShows,
  ) {
    final theatre = _theatreFor(theatreId);
    theatreShows.sort((a, b) => a.startTime.compareTo(b.startTime));

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.location_city_outlined, size: 18),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  theatre?.name ?? 'Theatre',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          if (theatre != null)
            Padding(
              padding: const EdgeInsets.only(left: 24, top: 2, bottom: 8),
              child: Text(
                theatre.location,
                style: const TextStyle(color: AppTheme.mutedText, fontSize: 12),
              ),
            ),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              for (final show in theatreShows) _showtimeChip(context, show),
            ],
          ),
        ],
      ),
    );
  }

  Widget _showtimeChip(BuildContext context, Show show) {
    final screen = _screenFor(show.screenId);
    final time = TimeOfDay.fromDateTime(show.startTime).format(context);

    return OutlinedButton(
      style: OutlinedButton.styleFrom(minimumSize: const Size(0, 44)),
      onPressed: () => _openSeatSelection(context, show, screen),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(time, style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(
            '${screen?.name ?? 'Screen'} - Rs. ${show.price}',
            style: const TextStyle(fontSize: 11),
          ),
        ],
      ),
    );
  }

  void _openSeatSelection(BuildContext context, Show show, Screen? screen) {
    final theatre = screen == null ? null : _theatreFor(screen.theatreId);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => SeatSelectionPage(
          movie: movie,
          show: show,
          theatreName: theatre?.name ?? 'Theatre',
          screenName: screen?.name ?? 'Screen',
          userId: userId,
          email: email,
          api: api,
        ),
      ),
    );
  }

  Screen? _screenFor(String screenId) {
    for (final screen in screens) {
      if (screen.id == screenId) return screen;
    }
    return null;
  }

  Theatre? _theatreFor(String theatreId) {
    for (final theatre in theatres) {
      if (theatre.id == theatreId) return theatre;
    }
    return null;
  }
}
