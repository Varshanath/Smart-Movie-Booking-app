import 'package:flutter/material.dart';

import '../../app/app_routes.dart';
import '../../core/storage/location_preference.dart';
import '../bookings/my_bookings_page.dart';
import 'models.dart';
import 'movie_booking_api.dart';
import 'movie_detail_page.dart';

class MovieListPage extends StatefulWidget {
  const MovieListPage({
    required this.email,
    this.userId = '',
    this.moviePreference = const [],
    this.api,
    super.key,
  });

  final String email;
  final String userId;
  final List<String> moviePreference;
  final MovieBookingApi? api;

  @override
  State<MovieListPage> createState() => _MovieListPageState();
}

class _MovieListPageState extends State<MovieListPage> {
  // Stands in for "All cities" in the picker so it's distinguishable from
  // the `null` that showModalBottomSheet returns when dismissed without a
  // choice (e.g. tapping outside the sheet).
  static const _allLocationsValue = 'all-locations';

  late final MovieBookingApi _api;
  var _loading = true;
  String? _error;
  var _movies = <Movie>[];
  var _locations = <MovieLocation>[];
  var _theatres = <Theatre>[];
  var _screens = <Screen>[];
  var _shows = <Show>[];
  String? _selectedLocationId;
  String? _selectedLocationName;
  var _forYouOnly = false;

  late final Set<String> _preferredGenres = widget.moviePreference
      .map((genre) => genre.toLowerCase())
      .toSet();

  List<Movie> get _filteredMovies {
    if (!_forYouOnly) return _movies;
    return _movies
        .where((movie) => _preferredGenres.contains(movie.genre.toLowerCase()))
        .toList();
  }

  @override
  void initState() {
    super.initState();
    _api = widget.api ?? MovieBookingApi();
    _selectedLocationId = LocationPreference.selectedLocationId;
    _selectedLocationName = LocationPreference.selectedLocationName;
    _load();
  }

  // The movie list itself is already filtered server-side by
  // _selectedLocationId (see _load). This only narrows which theatres'
  // showtimes surface in the "No shows" badge and the movie detail page.
  List<Show> get _visibleShows {
    if (_selectedLocationId == null) return _shows;
    return _shows.where((show) {
      final theatre = _theatreForShow(show);
      return theatre?.locationId == _selectedLocationId;
    }).toList();
  }

  Screen? _screenFor(String screenId) {
    for (final screen in _screens) {
      if (screen.id == screenId) return screen;
    }
    return null;
  }

  Theatre? _theatreFor(String theatreId) {
    for (final theatre in _theatres) {
      if (theatre.id == theatreId) return theatre;
    }
    return null;
  }

  Theatre? _theatreForShow(Show show) {
    final screen = _screenFor(show.screenId);
    if (screen == null) return null;
    return _theatreFor(screen.theatreId);
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        _api.getMovies(locationId: _selectedLocationId),
        _api.getLocations(),
        _api.getTheatres(),
        _api.getScreens(),
        _api.getShows(),
      ]);
      if (!mounted) return;
      setState(() {
        _movies = results[0] as List<Movie>;
        _locations = results[1] as List<MovieLocation>;
        _theatres = results[2] as List<Theatre>;
        _screens = results[3] as List<Screen>;
        _shows = results[4] as List<Show>;
        if (_selectedLocationId != null &&
            !_locations.any((location) => location.id == _selectedLocationId)) {
          _selectedLocationId = null;
          _selectedLocationName = null;
          LocationPreference.select(null, null);
        }
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
      body: SafeArea(
        child: Column(
          children: [
            if (!_loading && _error == null) _locationBar(context),
            if (!_loading && _error == null && _preferredGenres.isNotEmpty)
              _forYouFilterBar(context),
            Expanded(child: _body()),
          ],
        ),
      ),
    );
  }

  Widget _locationBar(BuildContext context) {
    return InkWell(
      onTap: _locations.isEmpty ? null : _pickLocation,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        color: Theme.of(context)
            .colorScheme
            .primaryContainer
            .withValues(alpha: 0.35),
        child: Row(
          children: [
            Icon(
              Icons.location_on_outlined,
              size: 18,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                _selectedLocationName ?? 'All cities',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
            const Icon(Icons.arrow_drop_down),
          ],
        ),
      ),
    );
  }

  Widget _forYouFilterBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
      child: Align(
        alignment: Alignment.centerLeft,
        child: FilterChip(
          avatar: const Icon(Icons.favorite_outline, size: 18),
          label: const Text('For You'),
          selected: _forYouOnly,
          onSelected: (selected) {
            setState(() => _forYouOnly = selected);
          },
        ),
      ),
    );
  }

  Future<void> _pickLocation() async {
    final locations = _locations;
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 4, 16, 8),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Choose your city',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                  ),
                ),
              ),
              _locationTile(context, label: 'All cities', value: _allLocationsValue),
              for (final location in locations)
                _locationTile(context, label: location.name, value: location.id),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );

    if (!mounted || selected == null) return;
    final newLocationId = selected == _allLocationsValue ? null : selected;
    if (newLocationId == _selectedLocationId) return;

    final newLocationName = newLocationId == null
        ? null
        : locations.firstWhere((location) => location.id == newLocationId).name;

    setState(() {
      _selectedLocationId = newLocationId;
      _selectedLocationName = newLocationName;
    });
    LocationPreference.select(newLocationId, newLocationName);
    _load();
  }

  Widget _locationTile(
    BuildContext context, {
    required String label,
    required String value,
  }) {
    final isSelected = value == _allLocationsValue
        ? _selectedLocationId == null
        : _selectedLocationId == value;
    return ListTile(
      title: Text(label),
      trailing: isSelected
          ? Icon(Icons.check, color: Theme.of(context).colorScheme.primary)
          : null,
      onTap: () => Navigator.pop(context, value),
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
              Text(
                _selectedLocationName == null
                    ? 'No movies are showing right now.\nCheck back soon.'
                    : 'No movies are showing in $_selectedLocationName right now.\nTry another city.',
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    final movies = _filteredMovies;

    if (movies.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.favorite_outline,
                  size: 48, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 12),
              const Text(
                "No movies match your preferences right now.",
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () => setState(() => _forYouOnly = false),
                child: const Text('Show all movies'),
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
        itemCount: movies.length,
        itemBuilder: (context, index) => _movieCard(movies[index]),
      ),
    );
  }

  Widget _movieCard(Movie movie) {
    final showsForMovie = _visibleShows.where((show) => show.movieId == movie.id).toList()
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
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: 12,
            ),
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
      [Color(0xFFFF4D6A), Color(0xFF8C66F2)],
      [Color(0xFF8C66F2), Color(0xFF161925)],
      [Color(0xFFFFC145), Color(0xFFFF4D6A)],
      [Color(0xFF4ADE80), Color(0xFF161925)],
      [Color(0xFF161925), Color(0xFFFF4D6A)],
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
                  arguments: {
                    'id': widget.userId,
                    'email': widget.email,
                    'moviePreference': widget.moviePreference,
                  },
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
