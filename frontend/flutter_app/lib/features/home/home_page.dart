import 'package:flutter/material.dart';

import '../../app/app_routes.dart';
import 'movie_booking_api.dart';

class HomePage extends StatefulWidget {
  const HomePage({
    required this.email,
    this.userId = '',
    this.api,
    super.key,
  });

  final String email;
  final String userId;
  final MovieBookingApi? api;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late final MovieBookingApi _api;
  final _movieFormKey = GlobalKey<FormState>();
  final _catalogFormKey = GlobalKey<FormState>();
  final _theatreFormKey = GlobalKey<FormState>();
  final _screenFormKey = GlobalKey<FormState>();
  final _showFormKey = GlobalKey<FormState>();
  final _paymentFormKey = GlobalKey<FormState>();
  final _bookingFormKey = GlobalKey<FormState>();
  final _relationFormKey = GlobalKey<FormState>();

  final _movieTitle = TextEditingController(text: 'Interstellar');
  final _movieGenre = TextEditingController(text: 'Sci-Fi');
  final _movieLanguage = TextEditingController(text: 'English');
  final _movieDuration = TextEditingController(text: '169');
  final _movieReleaseDate = TextEditingController(text: '2014-11-07');
  final _catalogName = TextEditingController(text: 'Sci-Fi');
  final _theatreName = TextEditingController(text: 'PVR Orion');
  final _theatreLocation = TextEditingController(text: 'Bengaluru');
  final _theatreSeats = TextEditingController(text: '120');
  final _screenName = TextEditingController(text: 'Screen 1');
  final _screenSeats = TextEditingController(text: '120');
  final _showStartTime =
      TextEditingController(text: '2026-08-01T18:30:00.000Z');
  final _paymentAmount = TextEditingController(text: '500');
  final _paymentReference = TextEditingController(text: 'pay_demo_001');
  final _bookingSeats = TextEditingController(text: '2');
  final _roleName = TextEditingController(text: 'Lead');

  var _data = <String, List<Map<String, dynamic>>>{};
  var _selectedCatalog = 'genres';
  var _paymentStatus = 'paid';
  String? _selectedTheatreId;
  String? _selectedMovieId;
  String? _selectedScreenId;
  String? _selectedShowId;
  String? _selectedPaymentId;
  String? _selectedGenreId;
  String? _selectedLanguageId;
  String? _selectedActorId;
  var _loading = true;
  var _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _api = widget.api ?? MovieBookingApi();
    _refresh();
  }

  @override
  void dispose() {
    for (final controller in [
      _movieTitle,
      _movieGenre,
      _movieLanguage,
      _movieDuration,
      _movieReleaseDate,
      _catalogName,
      _theatreName,
      _theatreLocation,
      _theatreSeats,
      _screenName,
      _screenSeats,
      _showStartTime,
      _paymentAmount,
      _paymentReference,
      _bookingSeats,
      _roleName,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Smart Movie Booking'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh),
            onPressed: _loading ? null : _refresh,
          ),
        ],
      ),
      drawer: _drawer(context),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : DefaultTabController(
                length: 5,
                child: Column(
                  children: [
                    _summaryHeader(context),
                    const TabBar(
                      isScrollable: true,
                      tabs: [
                        Tab(icon: Icon(Icons.movie_outlined), text: 'Browse'),
                        Tab(icon: Icon(Icons.tune), text: 'Setup'),
                        Tab(
                          icon: Icon(Icons.confirmation_number_outlined),
                          text: 'Book',
                        ),
                        Tab(icon: Icon(Icons.person_outline), text: 'Activity'),
                        Tab(icon: Icon(Icons.api), text: 'APIs'),
                      ],
                    ),
                    Expanded(
                      child: TabBarView(
                        children: [
                          _browseTab(),
                          _setupTab(),
                          _bookingTab(),
                          _activityTab(),
                          _apiTab(),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
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
              leading: const Icon(Icons.password_outlined),
              title: const Text('Change password'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(
                  context,
                  AppRoutes.changePassword,
                  arguments: widget.email,
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

  Widget _summaryHeader(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      color: colors.surface,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Operations dashboard',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _metric('Movies', _items('movies').length, Icons.movie_outlined),
              _metric(
                'Theatres',
                _items('theatres').length,
                Icons.location_city_outlined,
              ),
              _metric('Shows', _items('shows').length, Icons.schedule),
              _metric(
                'Bookings',
                _items('bookings').length,
                Icons.confirmation_number_outlined,
              ),
            ],
          ),
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(
              _error!,
              style: TextStyle(color: colors.error, fontWeight: FontWeight.w600),
            ),
          ],
        ],
      ),
    );
  }

  Widget _metric(String label, int value, IconData icon) {
    return Container(
      width: 154,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE4DDD7)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 8),
          Expanded(child: Text(label, overflow: TextOverflow.ellipsis)),
          Text('$value', style: const TextStyle(fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }

  Widget _browseTab() {
    return _scroll(
      children: [
        _section('Now showing', Icons.movie_outlined, [
          if (_items('movies').isEmpty) _empty('Create a movie from Setup.'),
          for (final movie in _items('movies'))
            _recordTile(
              icon: Icons.movie_outlined,
              title: _text(movie, 'title'),
              subtitle:
                  '${_text(movie, 'genre')} - ${_text(movie, 'language')} - ${movie['durationMinutes'] ?? '-'} min',
            ),
        ]),
        _section('Venues and screens', Icons.meeting_room_outlined, [
          if (_items('theatres').isEmpty && _items('screens').isEmpty)
            _empty('Add theatres and screens from Setup.'),
          for (final theatre in _items('theatres'))
            _recordTile(
              icon: Icons.location_city_outlined,
              title: _text(theatre, 'name'),
              subtitle:
                  '${_text(theatre, 'location')} - ${theatre['totalSeats'] ?? '-'} seats',
            ),
          for (final screen in _items('screens'))
            _recordTile(
              icon: Icons.meeting_room_outlined,
              title: _text(screen, 'name'),
              subtitle:
                  'Theatre ${_shortId(_text(screen, 'theatreId'))} - ${screen['totalSeats'] ?? '-'} seats',
            ),
        ]),
        _section('Scheduled shows', Icons.schedule, [
          if (_items('shows').isEmpty) _empty('Create a show from Setup.'),
          for (final show in _items('shows'))
            _recordTile(
              icon: Icons.schedule,
              title: _text(show, 'startTime'),
              subtitle:
                  'Movie ${_shortId(_text(show, 'movieId'))} - Screen ${_shortId(_text(show, 'screenId'))}',
            ),
        ]),
      ],
    );
  }

  Widget _setupTab() {
    return _scroll(
      children: [
        _formSection(
          'Create movie',
          Icons.movie_creation_outlined,
          _movieFormKey,
          [
            _field(_movieTitle, 'Title', Icons.title),
            _field(_movieGenre, 'Genre', Icons.category_outlined),
            _field(_movieLanguage, 'Language', Icons.language),
            _field(_movieDuration, 'Duration minutes', Icons.timer_outlined,
                number: true),
            _field(_movieReleaseDate, 'Release date', Icons.event_outlined),
            _submitButton('Create movie', Icons.add, () {
              if (_movieFormKey.currentState?.validate() != true) return;
              _submit(() => _api.post('/api/movies', {
                    'title': _movieTitle.text.trim(),
                    'genre': _movieGenre.text.trim(),
                    'language': _movieLanguage.text.trim(),
                    'durationMinutes': int.parse(_movieDuration.text),
                    'releaseDate': _movieReleaseDate.text.trim(),
                  }));
            }),
          ],
        ),
        _formSection('Catalog', Icons.sell_outlined, _catalogFormKey, [
          DropdownButtonFormField<String>(
            initialValue: _selectedCatalog,
            decoration: const InputDecoration(
              labelText: 'Catalog type',
              prefixIcon: Icon(Icons.list_alt_outlined),
            ),
            items: const [
              DropdownMenuItem(value: 'genres', child: Text('Genre')),
              DropdownMenuItem(value: 'languages', child: Text('Language')),
              DropdownMenuItem(value: 'actors', child: Text('Actor')),
            ],
            onChanged: (value) => setState(() => _selectedCatalog = value!),
          ),
          _field(_catalogName, 'Name', Icons.label_outline),
          _submitButton('Create catalog item', Icons.add, () {
            if (_catalogFormKey.currentState?.validate() != true) return;
            _submit(() => _api.post('/api/catalog/$_selectedCatalog', {
                  'name': _catalogName.text.trim(),
                }));
          }),
        ]),
        _formSection('Create theatre', Icons.location_city_outlined,
            _theatreFormKey, [
          _field(_theatreName, 'Name', Icons.business_outlined),
          _field(_theatreLocation, 'Location', Icons.location_on_outlined),
          _field(_theatreSeats, 'Total seats', Icons.event_seat_outlined,
              number: true),
          _submitButton('Create theatre', Icons.add, () {
            if (_theatreFormKey.currentState?.validate() != true) return;
            _submit(() => _api.post('/api/theatres', {
                  'name': _theatreName.text.trim(),
                  'location': _theatreLocation.text.trim(),
                  'totalSeats': int.parse(_theatreSeats.text),
                }));
          }),
        ]),
        _formSection('Create screen', Icons.meeting_room_outlined,
            _screenFormKey, [
          _dropdown('Theatre', _selectedTheatreId, _items('theatres'), 'name',
              Icons.location_city_outlined,
              (value) => setState(() => _selectedTheatreId = value)),
          _field(_screenName, 'Screen name', Icons.meeting_room_outlined),
          _field(_screenSeats, 'Total seats', Icons.event_seat_outlined,
              number: true),
          _submitButton('Create screen', Icons.add, () {
            if (_screenFormKey.currentState?.validate() != true) return;
            _submit(() => _api.post('/api/shows/screens', {
                  'theatreId': _selectedTheatreId,
                  'name': _screenName.text.trim(),
                  'totalSeats': int.parse(_screenSeats.text),
                }));
          }),
        ]),
        _formSection('Create show', Icons.schedule, _showFormKey, [
          _dropdown('Movie', _selectedMovieId, _items('movies'), 'title',
              Icons.movie_outlined,
              (value) => setState(() => _selectedMovieId = value)),
          _dropdown('Screen', _selectedScreenId, _items('screens'), 'name',
              Icons.meeting_room_outlined,
              (value) => setState(() => _selectedScreenId = value)),
          _field(_showStartTime, 'Start time ISO', Icons.schedule),
          _submitButton('Create show', Icons.add, () {
            if (_showFormKey.currentState?.validate() != true) return;
            _submit(() => _api.post('/api/shows', {
                  'movieId': _selectedMovieId,
                  'screenId': _selectedScreenId,
                  'startTime': _showStartTime.text.trim(),
                }));
          }),
        ]),
      ],
    );
  }

  Widget _bookingTab() {
    return _scroll(
      children: [
        _formSection('Create payment', Icons.payments_outlined,
            _paymentFormKey, [
          _field(_paymentAmount, 'Amount', Icons.currency_rupee, number: true),
          DropdownButtonFormField<String>(
            initialValue: _paymentStatus,
            decoration: const InputDecoration(
              labelText: 'Status',
              prefixIcon: Icon(Icons.verified_outlined),
            ),
            items: const [
              DropdownMenuItem(value: 'pending', child: Text('Pending')),
              DropdownMenuItem(value: 'paid', child: Text('Paid')),
              DropdownMenuItem(value: 'failed', child: Text('Failed')),
              DropdownMenuItem(value: 'refunded', child: Text('Refunded')),
            ],
            onChanged: (value) => setState(() => _paymentStatus = value!),
          ),
          _field(_paymentReference, 'Provider reference', Icons.receipt_long),
          _submitButton('Create payment', Icons.add_card_outlined, () {
            if (_paymentFormKey.currentState?.validate() != true) return;
            _submit(() => _api.post('/api/payments', {
                  'amount': num.parse(_paymentAmount.text),
                  'status': _paymentStatus,
                  'providerReference': _paymentReference.text.trim(),
                }));
          }),
        ]),
        _formSection('Book tickets', Icons.confirmation_number_outlined,
            _bookingFormKey, [
          _dropdown('Show', _selectedShowId, _items('shows'), 'startTime',
              Icons.schedule, (value) => setState(() => _selectedShowId = value)),
          _dropdown('Payment', _selectedPaymentId, _items('payments'), 'status',
              Icons.payments_outlined,
              (value) => setState(() => _selectedPaymentId = value)),
          _field(_bookingSeats, 'Seats', Icons.event_seat_outlined,
              number: true),
          _submitButton('Create booking', Icons.confirmation_number_outlined,
              () {
            if (_bookingFormKey.currentState?.validate() != true) return;
            if (widget.userId.isEmpty) {
              _showMessage('Login response did not include a user id.');
              return;
            }
            _submit(() => _api.post('/api/bookings/movie', {
                  'userId': widget.userId,
                  'showId': _selectedShowId,
                  'paymentId': _selectedPaymentId,
                  'seats': int.parse(_bookingSeats.text),
                }));
          }),
        ]),
        _section('Bookings', Icons.confirmation_number_outlined, [
          if (_items('bookings').isEmpty) _empty('No bookings yet.'),
          for (final booking in _items('bookings'))
            _recordTile(
              icon: Icons.confirmation_number_outlined,
              title: '${booking['seats'] ?? '-'} seats - ${booking['status']}',
              subtitle:
                  'Show ${_shortId(_text(booking, 'showId'))} - Payment ${_shortId(_text(booking, 'paymentId'))}',
            ),
        ]),
      ],
    );
  }

  Widget _activityTab() {
    return _scroll(
      children: [
        _formSection('Links and preferences', Icons.account_tree_outlined,
            _relationFormKey, [
          _dropdown('Movie', _selectedMovieId, _items('movies'), 'title',
              Icons.movie_outlined,
              (value) => setState(() => _selectedMovieId = value)),
          _dropdown('Genre', _selectedGenreId, _items('genres'), 'name',
              Icons.category_outlined,
              (value) => setState(() => _selectedGenreId = value)),
          _dropdown('Language', _selectedLanguageId, _items('languages'), 'name',
              Icons.language,
              (value) => setState(() => _selectedLanguageId = value)),
          _dropdown('Actor', _selectedActorId, _items('actors'), 'name',
              Icons.badge_outlined,
              (value) => setState(() => _selectedActorId = value)),
          _field(_roleName, 'Role name', Icons.theater_comedy_outlined,
              requiredField: false),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _smallAction('Add movie genre', Icons.category_outlined, () {
                _submit(() => _api.post('/api/movies/$_selectedMovieId/genres',
                    {'genreId': _selectedGenreId}));
              }),
              _smallAction('Add cast', Icons.groups_outlined, () {
                _submit(() => _api.post('/api/movies/$_selectedMovieId/cast', {
                      'actorId': _selectedActorId,
                      'roleName': _roleName.text.trim(),
                    }));
              }),
              _smallAction('Save preference', Icons.favorite_border, () {
                if (widget.userId.isEmpty) return _showMessage('Missing user id');
                _submit(() => _api.post('/api/users/${widget.userId}/preferences',
                    {
                      'genreId': _selectedGenreId,
                      'languageId': _selectedLanguageId,
                    }));
              }),
              _smallAction('Add history', Icons.history, () {
                if (widget.userId.isEmpty) return _showMessage('Missing user id');
                _submit(() => _api.post(
                    '/api/users/${widget.userId}/watch-history',
                    {'movieId': _selectedMovieId}));
              }),
            ],
          ),
        ]),
        _section('Preferences', Icons.favorite_border, [
          if (_items('preferences').isEmpty) _empty('No saved preferences.'),
          for (final item in _items('preferences'))
            _recordTile(
              icon: Icons.favorite_border,
              title: 'Preference ${_shortId(_text(item, 'id'))}',
              subtitle:
                  'Genre ${_shortId(_text(item, 'genreId'))} - Language ${_shortId(_text(item, 'languageId'))}',
            ),
        ]),
        _section('Watch history', Icons.history, [
          if (_items('watchHistory').isEmpty) _empty('No watch history.'),
          for (final item in _items('watchHistory'))
            _recordTile(
              icon: Icons.history,
              title: 'Movie ${_shortId(_text(item, 'movieId'))}',
              subtitle: _text(item, 'watchedAt'),
            ),
        ]),
      ],
    );
  }

  Widget _apiTab() {
    final endpoints = [
      'POST /api/users/register',
      'POST /api/users/login',
      'POST /api/users/change-password',
      'GET/POST /api/users/:userId/preferences',
      'GET/POST /api/users/:userId/watch-history',
      'GET/POST /api/catalog/languages',
      'GET/POST /api/catalog/genres',
      'GET/POST /api/catalog/actors',
      'GET/POST /api/movies',
      'GET/POST /api/movies/:movieId/genres',
      'GET/POST /api/movies/:movieId/cast',
      'GET/POST /api/theatres',
      'GET/POST /api/shows/screens',
      'GET/POST /api/shows',
      'GET/POST /api/payments',
      'GET/POST /api/bookings',
      'POST /api/bookings/movie',
    ];

    return _scroll(
      children: [
        _section('Bound API surface', Icons.api, [
          for (final endpoint in endpoints)
            _recordTile(
              icon: Icons.check_circle_outline,
              title: endpoint,
              subtitle: 'Connected from the Flutter UI',
            ),
        ]),
      ],
    );
  }

  Widget _scroll({required List<Widget> children}) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: children,
    );
  }

  Widget _section(String title, IconData icon, List<Widget> children) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
            ],
          ),
          const SizedBox(height: 10),
          ...children,
        ],
      ),
    );
  }

  Widget _formSection(
    String title,
    IconData icon,
    GlobalKey<FormState> key,
    List<Widget> children,
  ) {
    return Form(
      key: key,
      child: _section(
        title,
        icon,
        [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: const Color(0xFFE4DDD7)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final child in children) ...[
                  child,
                  const SizedBox(height: 12),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label,
    IconData icon, {
    bool number = false,
    bool requiredField = true,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: number ? TextInputType.number : TextInputType.text,
      decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon)),
      validator: (value) {
        if (!requiredField) return null;
        if (value == null || value.trim().isEmpty) return 'Required';
        if (number && num.tryParse(value) == null) return 'Enter a number';
        return null;
      },
    );
  }

  Widget _dropdown(
    String label,
    String? value,
    List<Map<String, dynamic>> items,
    String displayKey,
    IconData icon,
    ValueChanged<String?> onChanged,
  ) {
    final validValue = items.any((item) => item['id'] == value) ? value : null;
    return DropdownButtonFormField<String>(
      value: validValue,
      decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon)),
      items: [
        for (final item in items)
          DropdownMenuItem(
            value: _text(item, 'id'),
            child: Text(
              _text(item, displayKey),
              overflow: TextOverflow.ellipsis,
            ),
          ),
      ],
      onChanged: onChanged,
      validator: (newValue) =>
          newValue == null || newValue.isEmpty ? 'Required' : null,
    );
  }

  Widget _submitButton(String label, IconData icon, VoidCallback onPressed) {
    return ElevatedButton.icon(
      icon: Icon(icon),
      label: Text(_submitting ? 'Saving...' : label),
      onPressed: _submitting ? null : onPressed,
    );
  }

  Widget _smallAction(String label, IconData icon, VoidCallback onPressed) {
    return OutlinedButton.icon(
      icon: Icon(icon),
      label: Text(label),
      onPressed: _submitting ? null : onPressed,
    );
  }

  Widget _recordTile({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE4DDD7)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListTile(
        leading: Icon(icon),
        title: Text(title, overflow: TextOverflow.ellipsis),
        subtitle: Text(subtitle, overflow: TextOverflow.ellipsis),
      ),
    );
  }

  Widget _empty(String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBFE),
        border: Border.all(color: const Color(0xFFE4DDD7)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(text),
    );
  }

  Future<void> _refresh() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await _api.loadWorkspace(userId: widget.userId);
      if (!mounted) return;
      setState(() {
        _data = data;
        _selectedTheatreId = _firstId('theatres', _selectedTheatreId);
        _selectedMovieId = _firstId('movies', _selectedMovieId);
        _selectedScreenId = _firstId('screens', _selectedScreenId);
        _selectedShowId = _firstId('shows', _selectedShowId);
        _selectedPaymentId = _firstId('payments', _selectedPaymentId);
        _selectedGenreId = _firstId('genres', _selectedGenreId);
        _selectedLanguageId = _firstId('languages', _selectedLanguageId);
        _selectedActorId = _firstId('actors', _selectedActorId);
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error is MovieBookingApiException
          ? error.message
          : 'Unable to load booking data right now.');
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _submit(Future<dynamic> Function() action) async {
    setState(() => _submitting = true);
    try {
      await action();
      await _refresh();
      _showMessage('Saved successfully');
    } catch (error) {
      _showMessage(error is MovieBookingApiException
          ? error.message
          : 'Unable to save right now');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  List<Map<String, dynamic>> _items(String key) => _data[key] ?? [];

  String? _firstId(String key, String? current) {
    final items = _items(key);
    if (items.any((item) => item['id'] == current)) return current;
    return items.isEmpty ? null : _text(items.first, 'id');
  }

  String _text(Map<String, dynamic> item, String key) {
    final value = item[key];
    return value == null ? '' : value.toString();
  }

  String _shortId(String id) {
    if (id.isEmpty) return '-';
    return id.length <= 8 ? id : id.substring(0, 8);
  }
}
