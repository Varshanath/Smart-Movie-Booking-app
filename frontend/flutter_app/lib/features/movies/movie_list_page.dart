import 'package:flutter/material.dart';

import '../../app/app_routes.dart';
import '../bookings/my_bookings_page.dart';
import 'models.dart';
import 'movie_booking_api.dart';
import 'movie_detail_page.dart';

class MovieListPage extends StatefulWidget {
  const MovieListPage({
    required this.email,
    this.userId = '',
    this.api,
    super.key,
  });

  final String email;
  final String userId;
  final MovieBookingApi? api;

  @override
  State<MovieListPage> createState() => _MovieListPageState();
}

class _MovieListPageState extends State<MovieListPage> {
  late final MovieBookingApi _api;
  var _loading = true;
  String? _error;
  var _movies = <Movie>[];
  var _theatres = <Theatre>[];
  var _screens = <Screen>[];
  var _shows = <Show>[];

  @override
  void initState() {
    super.initState();
    _api = widget.api ?? MovieBookingApi();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        _api.getMovies(),
        _api.getTheatres(),
        _api.getScreens(),
        _api.getShows(),
      ]);
      if (!mounted) return;
      setState(() {
        _movies = results[0] as List<Movie>;
        _theatres = results[1] as List<Theatre>;
        _screens = results[2] as List<Screen>;
        _shows = results[3] as List<Show>;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error is MovieBookingApiException
            ? error.message
            : 'Unable to load movies right now.';
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Now Showing'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh),
            onPressed: _loading ? null : _load,
          ),
        ],
      ),
      drawer: _drawer(context),
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

    if (_movies.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.movie_filter_outlined,
                  size: 48, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 12),
              const Text(
                'No movies are showing right now.\nCheck back soon.',
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          childAspectRatio: 0.62,
        ),
        itemCount: _movies.length,
        itemBuilder: (context, index) => _movieCard(_movies[index]),
      ),
    );
  }

  Widget _movieCard(Movie movie) {
    final showsForMovie = _shows.where((show) => show.movieId == movie.id).toList()
      ..sort((a, b) => a.startTime.compareTo(b.startTime));

    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => _openMovie(movie, showsForMovie),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: _posterColors(movie.genre),
                ),
              ),
              child: Stack(
                children: [
                  const Center(
                    child: Icon(
                      Icons.local_movies_outlined,
                      size: 48,
                      color: Colors.white70,
                    ),
                  ),
                  Positioned(
                    left: 8,
                    top: 8,
                    child: Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.35),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        movie.genre,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  if (showsForMovie.isEmpty)
                    Positioned(
                      right: 8,
                      bottom: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.35),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'No shows',
                          style: TextStyle(color: Colors.white, fontSize: 10),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            movie.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 2),
          Text(
            '${movie.language} - ${movie.durationLabel}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
          ),
        ],
      ),
    );
  }

  void _openMovie(Movie movie, List<Show> showsForMovie) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MovieDetailPage(
          movie: movie,
          shows: showsForMovie,
          theatres: _theatres,
          screens: _screens,
          userId: widget.userId,
          email: widget.email,
          api: _api,
        ),
      ),
    );
  }

  List<Color> _posterColors(String genre) {
    const palette = [
      [Color(0xFF7B1FA2), Color(0xFFB3261E)],
      [Color(0xFF1565C0), Color(0xFF00838F)],
      [Color(0xFF2E7D32), Color(0xFF9E9D24)],
      [Color(0xFFAD1457), Color(0xFFE65100)],
      [Color(0xFF37474F), Color(0xFF546E7A)],
    ];
    final index = genre.hashCode.abs() % palette.length;
    return palette[index];
  }

  Widget _drawer(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Icon(
                    Icons.local_movies_outlined,
                    size: 42,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    widget.email.isEmpty ? 'Movie bookings' : widget.email,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.confirmation_number_outlined),
              title: const Text('My bookings'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => MyBookingsPage(
                      userId: widget.userId,
                      api: _api,
                    ),
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.password_outlined),
              title: const Text('Change password'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(
                  context,
                  AppRoutes.changePassword,
                  arguments: {'id': widget.userId, 'email': widget.email},
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Logout'),
              onTap: () {
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  AppRoutes.login,
                  (route) => false,
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
