import 'package:flutter/material.dart';

import '../../app/app_routes.dart';
import '../../features/bookings/my_bookings_page.dart';
import '../../features/movies/movie_booking_api.dart';
import '../../features/profile/profile_settings_page.dart';

typedef ProfileUpdated = void Function(
  String profileLocation,
  List<String> moviePreference,
);

class AppDrawer extends StatelessWidget {
  const AppDrawer({
    required this.email,
    required this.userId,
    required this.api,
    this.profileLocation = '',
    this.moviePreference = const [],
    this.onProfileUpdated,
    super.key,
  });

  final String email;
  final String userId;
  final MovieBookingApi api;
  final String profileLocation;
  final List<String> moviePreference;
  final ProfileUpdated? onProfileUpdated;

  @override
  Widget build(BuildContext context) {
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
                    email.isEmpty ? 'Movie bookings' : email,
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
                      userId: userId,
                      email: email,
                      profileLocation: profileLocation,
                      moviePreference: moviePreference,
                      api: api,
                    ),
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings_outlined),
              title: const Text('Profile settings'),
              onTap: () async {
                Navigator.pop(context);
                final result = await Navigator.push<Map<String, dynamic>>(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ProfileSettingsPage(
                      userId: userId,
                      email: email,
                      location: profileLocation,
                      moviePreference: moviePreference,
                      api: api,
                    ),
                  ),
                );
                if (result == null) return;
                onProfileUpdated?.call(
                  result['location'] as String? ?? profileLocation,
                  (result['moviePreference'] as List<String>?) ?? moviePreference,
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
