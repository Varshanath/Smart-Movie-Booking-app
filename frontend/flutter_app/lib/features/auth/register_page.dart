import 'package:flutter/material.dart';

import '../../shared/widgets/auth_page_shell.dart';
import 'user_registration_api.dart';

typedef RegisterUser = Future<void> Function(Map<String, Object> payload);

class RegisterPage extends StatefulWidget {
  const RegisterPage({
    super.key,
    this.registerUser = _registerWithApi,
  });

  final RegisterUser registerUser;

  static Future<void> _registerWithApi(Map<String, Object> payload) {
    return UserRegistrationApi().registerUser(payload);
  }

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _locationController = TextEditingController();
  final _moviePreferenceController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  String _gender = 'prefer_not_to_say';
  bool _hidePassword = true;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _locationController.dispose();
    _moviePreferenceController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthPageShell(
      title: 'Create account',
      subtitle: 'Tell us your details so we can personalize movie bookings.',
      children: [
        Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _nameController,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Full name',
                  prefixIcon: Icon(Icons.badge_outlined),
                ),
                validator: _required('Enter your full name'),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _gender,
                decoration: const InputDecoration(
                  labelText: 'Gender',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                items: const [
                  DropdownMenuItem(value: 'male', child: Text('Male')),
                  DropdownMenuItem(value: 'female', child: Text('Female')),
                  DropdownMenuItem(value: 'other', child: Text('Other')),
                  DropdownMenuItem(
                    value: 'prefer_not_to_say',
                    child: Text('Prefer not to say'),
                  ),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _gender = value);
                  }
                },
              ),
              const SizedBox(height: 16),
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
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Movie preference',
                  hintText: 'Action, comedy, romance',
                  prefixIcon: Icon(Icons.movie_filter_outlined),
                ),
                validator: _required('Enter at least one movie preference'),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Email ID',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Enter your email ID';
                  }
                  if (!value.contains('@')) {
                    return 'Enter a valid email ID';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Phone number',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
                validator: _required('Enter your phone number'),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordController,
                obscureText: _hidePassword,
                textInputAction: TextInputAction.done,
                decoration: InputDecoration(
                  labelText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    tooltip: _hidePassword ? 'Show password' : 'Hide password',
                    icon: Icon(
                      _hidePassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                    ),
                    onPressed: () {
                      setState(() => _hidePassword = !_hidePassword);
                    },
                  ),
                ),
                validator: (value) {
                  if (value == null || value.length < 6) {
                    return 'Password must be at least 6 characters';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                icon: const Icon(Icons.person_add_alt_1),
                label: Text(_isSubmitting ? 'Registering...' : 'Register'),
                onPressed: _isSubmitting ? null : _submitRegistration,
              ),
              const SizedBox(height: 12),
              TextButton.icon(
                icon: const Icon(Icons.arrow_back),
                label: const Text('Back to login'),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
        ),
      ],
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

  Future<void> _submitRegistration() async {
    if (_formKey.currentState?.validate() != true) {
      return;
    }

    setState(() => _isSubmitting = true);

    final payload = <String, Object>{
      'name': _nameController.text.trim(),
      'gender': _gender,
      'location': _locationController.text.trim(),
      'moviePreference': _moviePreferenceController.text
          .split(',')
          .map((preference) => preference.trim())
          .where((preference) => preference.isNotEmpty)
          .toList(),
      'email': _emailController.text.trim(),
      'phoneNumber': _phoneController.text.trim(),
    };

    try {
      await widget.registerUser(payload);

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('User registered successfully')),
      );
      Navigator.pop(context);
    } on UserRegistrationException catch (error) {
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
        const SnackBar(content: Text('Unable to register user right now')),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }
}
