import 'package:flutter/material.dart';

import '../../app/app_routes.dart';
import '../../shared/theme/app_theme.dart';
import '../../shared/widgets/app_drawer.dart';
import '../auth/auth_api.dart';
import '../auth/change_password_page.dart';
import '../movies/movie_booking_api.dart';

typedef UpdateProfile = Future<dynamic> Function({
  required String userId,
  required String location,
  required List<String> moviePreference,
});

class ProfileSettingsPage extends StatefulWidget {
  ProfileSettingsPage({
    required this.userId,
    required this.email,
    this.location = '',
    this.moviePreference = const [],
    MovieBookingApi? api,
    super.key,
    this.updateProfile = _updateProfileWithApi,
  }) : api = api ?? MovieBookingApi();

  final String userId;
  final String email;
  final String location;
  final List<String> moviePreference;
  final MovieBookingApi api;
  final UpdateProfile updateProfile;

  static Future<dynamic> _updateProfileWithApi({
    required String userId,
    required String location,
    required List<String> moviePreference,
  }) {
    return AuthApi().updateProfile(
      userId: userId,
      location: location,
      moviePreference: moviePreference,
    );
  }

  @override
  State<ProfileSettingsPage> createState() => _ProfileSettingsPageState();
}

class _ProfileSettingsPageState extends State<ProfileSettingsPage> {
  final _formKey = GlobalKey<FormState>();
  late final _locationController = TextEditingController(text: widget.location);
  late final _moviePreferenceController =
      TextEditingController(text: widget.moviePreference.join(', '));
  var _isSaving = false;

  @override
  void dispose() {
    _locationController.dispose();
    _moviePreferenceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile settings')),
      drawer: AppDrawer(
        userId: widget.userId,
        email: widget.email,
        profileLocation: widget.location,
        moviePreference: widget.moviePreference,
        api: widget.api,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _locationController,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Location',
                      prefixIcon: Icon(Icons.location_on_outlined),
                    ),
                    validator: _required('Enter your location'),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _moviePreferenceController,
                    textInputAction: TextInputAction.done,
                    decoration: const InputDecoration(
                      labelText: 'Movie preference',
                      hintText: 'Action, comedy, romance',
                      prefixIcon: Icon(Icons.movie_filter_outlined),
                    ),
                    validator: _required('Enter at least one movie preference'),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.save_outlined),
                    label: Text(_isSaving ? 'Saving...' : 'Save changes'),
                    onPressed: _isSaving ? null : _save,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            const Divider(color: AppTheme.border),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.password_outlined),
              title: const Text('Change password'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ChangePasswordPage(
                      userId: widget.userId,
                      email: widget.email,
                      location: widget.location,
                      moviePreference: widget.moviePreference,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  String? Function(String?) _required(String message) {
    return (value) {
      if (value == null || value.trim().isEmpty) {
        return message;
      }
      return null;
    };
  }

  Future<void> _save() async {
    if (_formKey.currentState?.validate() != true) {
      return;
    }

    final location = _locationController.text.trim();
    final moviePreference = _moviePreferenceController.text
        .split(',')
        .map((preference) => preference.trim())
        .where((preference) => preference.isNotEmpty)
        .toList();

    setState(() => _isSaving = true);
    try {
      await widget.updateProfile(
        userId: widget.userId,
        location: location,
        moviePreference: moviePreference,
      );

      if (!mounted) {
        return;
      }
      Navigator.pushNamedAndRemoveUntil(
        context,
        AppRoutes.home,
        (route) => false,
        arguments: {
          'id': widget.userId,
          'email': widget.email,
          'location': location,
          'moviePreference': moviePreference,
        },
      );
    } on AuthApiException catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to update profile right now')),
      );
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }
}
