import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../shared/theme/app_theme.dart';
import '../../shared/widgets/app_bar_actions.dart';
import '../../shared/widgets/app_drawer.dart';
import '../booking/seat_selection_page.dart';
import '../movies/models.dart';
import '../movies/movie_booking_api.dart';

const _avatarPalette = [
  Color(0xFFFF4D6A),
  Color(0xFFFA8C6B),
  Color(0xFF6BADFA),
  Color(0xFFA680F2),
  Color(0xFFF5BF4D),
];

class WhoIsComingPage extends StatefulWidget {
  const WhoIsComingPage({
    required this.movie,
    required this.show,
    required this.theatreName,
    required this.screenName,
    required this.userId,
    required this.email,
    this.profileLocation = '',
    this.moviePreference = const [],
    this.api,
    super.key,
  });

  final Movie movie;
  final Show show;
  final String theatreName;
  final String screenName;
  final String userId;
  final String email;
  final String profileLocation;
  final List<String> moviePreference;
  final MovieBookingApi? api;

  @override
  State<WhoIsComingPage> createState() => _WhoIsComingPageState();
}

class _WhoIsComingPageState extends State<WhoIsComingPage> {
  late final MovieBookingApi _api;
  final _searchController = TextEditingController();
  final _guestsController = TextEditingController(text: '0');
  final _searchFocusNode = FocusNode();
  Timer? _debounce;

  var _initialLoading = true;
  String? _error;
  var _people = <UserSummary>[];
  final _selected = <String, UserSummary>{};
  var _extraGuests = 0;

  @override
  void initState() {
    super.initState();
    _api = widget.api ?? MovieBookingApi();
    _loadPeople('');
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    _guestsController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  Future<void> _loadPeople(String query) async {
    setState(() => _error = null);
    try {
      final people = await _api.searchUsers(
        search: query,
        excludeUserId: widget.userId,
      );
      if (!mounted) return;
      setState(() => _people = people);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Unable to load people right now.');
    } finally {
      if (mounted) setState(() => _initialLoading = false);
    }
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      _loadPeople(value.trim());
    });
  }

  void _toggleSelected(UserSummary person) {
    setState(() {
      if (_selected.containsKey(person.id)) {
        _selected.remove(person.id);
      } else {
        _selected[person.id] = person;
      }
    });
  }

  int get _totalGuests => _selected.length + _extraGuests;

  void _continue() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => SeatSelectionPage(
          movie: widget.movie,
          show: widget.show,
          theatreName: widget.theatreName,
          screenName: widget.screenName,
          userId: widget.userId,
          email: widget.email,
          profileLocation: widget.profileLocation,
          moviePreference: widget.moviePreference,
          api: _api,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: backButtonLeading(context),
        actions: [drawerMenuAction()],
      ),
      drawer: AppDrawer(
        userId: widget.userId,
        email: widget.email,
        profileLocation: widget.profileLocation,
        moviePreference: widget.moviePreference,
        api: _api,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
                children: [
                  Text("Who's coming? \u{1F39F}\u{FE0F}",
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 6),
                  const Text(
                    'Add your group so we can find seats and picks everyone likes.',
                    style: TextStyle(color: AppTheme.mutedText, fontSize: 14),
                  ),
                  const SizedBox(height: 24),
                  TextField(
                    controller: _searchController,
                    focusNode: _searchFocusNode,
                    onChanged: _onSearchChanged,
                    decoration: const InputDecoration(
                      hintText: 'Search friends or invite by phone',
                      prefixIcon: Icon(Icons.search, color: AppTheme.mutedText),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Selected (${_selected.length})',
                    style: const TextStyle(
                      color: AppTheme.mutedText,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _selectedRow(),
                  const SizedBox(height: 28),
                  const Text(
                    'Additional guests (not on CineMatch)',
                    style: TextStyle(
                      color: AppTheme.mutedText,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _guestsController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                      hintText: '# of extra people joining (e.g. 2)',
                    ),
                    onChanged: (value) {
                      setState(() => _extraGuests = int.tryParse(value) ?? 0);
                    },
                  ),
                  const SizedBox(height: 20),
                  Text(
                    _searchController.text.trim().isEmpty
                        ? 'Suggested from your contacts'
                        : 'Search results',
                    style: const TextStyle(
                      color: AppTheme.mutedText,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _peopleList(),
                ],
              ),
            ),
            _continueBar(),
          ],
        ),
      ),
    );
  }

  Widget _continueBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 12),
      decoration: const BoxDecoration(
        color: AppTheme.surface,
        border: Border(top: BorderSide(color: AppTheme.border)),
      ),
      child: ElevatedButton(
        onPressed: _continue,
        child: Text('Continue with group of $_totalGuests'),
      ),
    );
  }

  Widget _selectedRow() {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (final person in _selected.values) _avatar(person),
        _addAvatarButton(),
      ],
    );
  }

  Widget _avatar(UserSummary person) {
    final color = _avatarPalette[person.id.hashCode.abs() % _avatarPalette.length];
    return CircleAvatar(
      radius: 22,
      backgroundColor: color,
      child: Text(
        person.name.isNotEmpty ? person.name[0].toUpperCase() : '?',
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w600,
          fontSize: 16,
        ),
      ),
    );
  }

  Widget _addAvatarButton() {
    return GestureDetector(
      onTap: () => FocusScope.of(context).requestFocus(_searchFocusNode),
      child: Container(
        width: 44,
        height: 44,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          border: Border.fromBorderSide(BorderSide(color: AppTheme.border)),
        ),
        child: const Icon(Icons.add, color: AppTheme.mutedText),
      ),
    );
  }

  Widget _peopleList() {
    if (_initialLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Text(_error!, style: const TextStyle(color: AppTheme.mutedText)),
      );
    }

    if (_people.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Text(
          'No one else on CineMatch matches yet.',
          style: TextStyle(color: AppTheme.mutedText),
        ),
      );
    }

    return Column(
      children: [for (final person in _people) _personTile(person)],
    );
  }

  Widget _personTile(UserSummary person) {
    final selected = _selected.containsKey(person.id);
    final subtitle = person.moviePreference.isNotEmpty
        ? 'Loves ${person.moviePreference.first}'
        : 'New to CineMatch';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _toggleSelected(person),
        child: Row(
          children: [
            _avatar(person),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    person.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: AppTheme.mutedText,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? AppTheme.primary : null,
                border: selected
                    ? null
                    : const Border.fromBorderSide(
                        BorderSide(color: AppTheme.border),
                      ),
              ),
              child: Icon(
                selected ? Icons.check : Icons.add,
                size: 14,
                color: selected ? Colors.white : AppTheme.mutedText,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
